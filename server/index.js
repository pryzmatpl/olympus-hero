import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory, isOpenAIQuotaError, isOpenAIAuthOrConfigError, checkOpenAIQuotaExceeded, setOpenAIQuotaExceeded } from './openai.js';
import { registerUser, loginUser, authMiddleware, getUserById, addHeroToUser } from './auth.js';
import { processPaymentAndCreateNFT, getNFTById, getNFTsByHeroId } from './stripe.js';
import { createSharedLink, accessSharedHero, getSharedLinksByUser, deactivateSharedLink } from './share.js';
import { initializeDB, heroDb, storyBookDb, userDb } from './db.js';
import {
  issueAgentDriveToken,
  revokeAgentDriveToken,
  listAgentDriveTokensForHero,
  verifyAgentDriveToken,
} from './agentAuth.js';
import { applyProgressEvent } from './progression.js';
import { getStoryArcTemplate } from './storyArcs.js';
import { moderateProposalText } from './moderation.js';
import { postHeroLore, patchHeroLore, deleteHeroLore, normalizeLoreJournal } from './heroLore.js';
import {
  appendUserMessageAndMaybeNarrator,
  appendInitialRoomNarrator,
} from './sharedStoryNarrator.js';
import {
  isElevenLabsConfigured,
  narratorHtmlToSpokenText,
  getOrSynthesizeNarration,
} from './elevenlabs.js';
import { insertAnalyticsEvent, parseAnalyticsBody } from './analytics.js';
import { ensureStorageDirectories, createHeroZip } from './utils.js';
import {
  createSharedStoryRoom,
  joinSharedStoryRoom,
  leaveSharedStoryRoom,
  getSharedStoryRoom,
  listSharedStoryRooms,
  listStoryArcSummaries,
  mutateSharedStoryRoom,
  summarizeStoryArcForRoom,
} from './sharedStory.js';
import {
  createStoryBook,
  getOrCreateStoryBook,
  getStoryBookChapters,
  unlockChapters,
  checkAndUnlockDailyChapters,
  fixStoryBookChapters,
  ensureHeroStorybookChapterOne,
  promoteStorybookAfterPremiumPayment,
} from './storybook.js';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import stripe from 'stripe';

// Load environment variables
dotenv.config();

// Global error handlers to prevent crashes - set up FIRST before anything else
process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Error message:', reason.message);
    console.error('Error stack:', reason.stack);
  } else {
    console.error('Reason type:', typeof reason);
    console.error('Reason value:', reason);
  }
  console.error('===========================');
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Error name:', error.name);
  if (error.code) {
    console.error('Error code:', error.code);
  }
  console.error('===========================');
  // Don't exit the process, just log the error
});

process.on('exit', (code) => {
  console.error('=== PROCESS EXITING ===');
  console.error('Exit code:', code);
  console.error('===========================');
});

process.on('SIGTERM', () => {
  console.error('=== SIGTERM RECEIVED ===');
});

process.on('SIGINT', () => {
  console.error('=== SIGINT RECEIVED ===');
});

// Safe import of OpenAI-related modules
const safeRequireOpenAI = () => {
  try {
    // Only attempt to import OpenAI if we have an API key
    if (process.env.OPENAI_API_KEY) {
      return import('./openai.js');
    } else {
      console.warn('WARNING: OPENAI_API_KEY is not set. OpenAI features will be disabled.');
      // Return mock implementation of OpenAI-related functions to avoid errors
      return Promise.resolve({
        generateOpenAIImages: () => Promise.resolve([{ url: '/default-image.png' }]),
        generateBackstory: () => Promise.resolve('A backstory could not be generated due to API configuration.'),
        isOpenAIQuotaError: () => false,
        isOpenAIAuthOrConfigError: () => false,
        checkOpenAIQuotaExceeded: () => false,
        setOpenAIQuotaExceeded: () => {}
      });
    }
  } catch (error) {
    console.error('Error loading OpenAI module:', error);
    // Return mock implementation of OpenAI-related functions to avoid errors
    return Promise.resolve({
      generateOpenAIImages: () => Promise.resolve([{ url: '/default-image.png' }]),
      generateBackstory: () => Promise.resolve('A backstory could not be generated due to API configuration.'),
      isOpenAIQuotaError: () => false,
      isOpenAIAuthOrConfigError: () => false,
      checkOpenAIQuotaExceeded: () => false,
      setOpenAIQuotaExceeded: () => {}
    });
  }
};

// Check if migration mode is requested
const args = process.argv.slice(2);
if (args.includes('--migrate-passwords')) {
  console.log('Running password migration script...');
  // Use dynamic import for the migration script
  (async () => {
    try {
      await import('./migratePlaintextPasswords.js');
      console.log('Migration completed successfully.');
    } catch (err) {
      console.error('Error running migration script:', err);
      process.exit(1);
    }
  })();
} else {
  // Start the main server
  startServer();
}

/**
 * Allow apex + www for production domain, localhost in dev (Express + Socket.IO CORS).
 * @param {string | undefined} origin
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
function corsAllowMythicalHero(origin, callback) {
  try {
    if (!origin) {
      return callback(null, true);
    }
    const { hostname } = new URL(origin);
    const base = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    if (base === 'mythicalhero.me') {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }
    }
    return callback(null, false);
  } catch {
    return callback(null, false);
  }
}

async function startServer() {
  try {
    // Only require JWT_SECRET as absolutely essential
    if (!process.env.JWT_SECRET) {
      console.error('Error: Missing required environment variable: JWT_SECRET');
      console.error('Make sure this variable is set in your .env file or environment.');
      process.exit(1);
    }
    
    // Load OpenAI module safely - will use mock functions if API key isn't available
    const openaiModule = await safeRequireOpenAI();
    const { 
      generateOpenAIImages, 
      generateBackstory, 
      isOpenAIQuotaError,
      isOpenAIAuthOrConfigError,
      checkOpenAIQuotaExceeded, 
      setOpenAIQuotaExceeded 
    } = openaiModule;
    
    // Initialize Stripe only if key is available
    let stripeInstance;
    if (process.env.STRIPE_SECRET_KEY) {
      stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    } else {
      console.warn('WARNING: STRIPE_SECRET_KEY is not set. Payment features will be disabled.');
    }

    // Initialize the database connection
    initializeDB().catch(error => {
      console.error('Database connection error:', error);
      // Don't exit process, as the app might still work for some features
    });

    // Initialize storage directories
    console.log('Initializing storage directories...');
    ensureStorageDirectories().then(() => {
      console.log('Storage directories initialized successfully');
    }).catch(err => {
      console.error('Failed to create storage directories:', err);
    });

    const app = express();
    app.set('trust proxy', 1);

    const httpServer = createServer(app);
    
    // Configure Socket.IO to work with HTTPS
    const io = new Server(httpServer, {
      cors: {
        origin: corsAllowMythicalHero,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });
    
    const PORT = process.env.PORT || 9002;

    // Enable CORS debugging
    console.log('Setting up CORS middleware...');

    const expressCorsOptions = {
      origin: corsAllowMythicalHero,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    // Request logging (do not handle OPTIONS here — it hardcoded Allow-Origin and broke www + Socket.IO)
    app.use((req, res, next) => {
      console.log(`${req.method} request for ${req.url}`);
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      console.log(`Request protocol: ${protocol}, host: ${host}`);
      next();
    });

    app.use(cors(expressCorsOptions));
    app.options('*', cors(expressCorsOptions));

    app.use(express.json());

    // Serve static files from the storage directory
    app.use('/storage', express.static(path.join(process.cwd(), 'storage')));
    console.log('Static file serving enabled from:', path.join(process.cwd(), 'storage'));

    // Debugging endpoint to check if server is alive
    app.get('/ping', (req, res) => {
      res.json({ message: 'pong', timestamp: new Date().toISOString() });
    });

    app.get('/api/health', async (req, res) => {
      try {
        await initializeDB();
        return res.json({
          ok: true,
          database: 'connected',
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('GET /api/health database check failed:', e);
        return res.status(503).json({
          ok: false,
          database: 'unavailable',
          timestamp: new Date().toISOString(),
        });
      }
    });

    app.post('/api/analytics/event', async (req, res) => {
      try {
        const parsed = parseAnalyticsBody(req.body);
        if (!parsed.ok) {
          return res.status(400).json({ error: parsed.error });
        }
        const fwd = req.headers['x-forwarded-for'];
        const ip =
          typeof fwd === 'string'
            ? fwd.split(',')[0].trim()
            : req.socket.remoteAddress;
        await insertAnalyticsEvent({
          ...parsed.value,
          userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
          ip: String(ip || '').slice(0, 45),
        });
        return res.status(204).end();
      } catch (e) {
        console.error('analytics event error', e);
        return res.status(500).json({ error: 'Failed to record event' });
      }
    });

    // Endpoint to process payment and create NFT using Charges API
    app.post('/api/process-payment', async (req, res) => {
      const { heroId, stripeToken, amount, currency, walletAddress, email } = req.body;

      console.log('Payment processing started for hero:', heroId);
      console.log('Payment details received:', { 
        heroId, 
        stripeToken,
        hasToken: !!stripeToken, 
        amount, 
        currency, 
        hasWallet: !!walletAddress, 
        hasEmail: !!email 
      });
      
      try {
        // Initialize database connection early
        const db = await initializeDB();
        if (!db) {
          throw new Error('Database connection failed');
        }
        
        // Validate inputs
        if (!heroId || !stripeToken) {
          console.error('Missing required payment fields:', { heroId, hasToken: !!stripeToken });
          return res.status(400).json({ error: 'Missing required payment fields' });
        }
        
        // Check if the hero exists
        const hero = await heroDb.findHeroById(heroId);
        if (!hero) {
          console.error('Hero not found for payment:', heroId);
          return res.status(404).json({ error: 'Hero not found' });
        }
        
        // Check if hero is already paid
        if (hero.paymentStatus === 'paid') {
          console.log('Hero already paid for:', heroId);
          // Return success with existing NFT if it exists
          if (hero.nftId) {
            const existingNft = await db.collection('nfts').findOne({ id: hero.nftId });
            if (existingNft) {
              return res.status(200).json(existingNft);
            }
          }
        }
        
        // Determine if we're in development or production mode
        const isDevelopment = process.env.NODE_ENV !== 'production';
        
        // Check token type:
        // 1. tok_<timestamp> - Development mode mock token
        // 2. real_tok_<timestamp> - Production mode token that should use real Stripe in prod, but mocked in dev
        // 3. tok_<random_string> - Real Stripe token (usually starts with 'tok_' followed by alphanumeric characters)
        const isDevelopmentMockToken = stripeToken.match(/^tok_\d+$/);
        const isProductionMockToken = stripeToken.match(/^real_tok_\d+$/);
        const isRealStripeToken = stripeToken.match(/^tok_[a-zA-Z0-9_]{2,}$/);
        
        // Determine if we should use mock processing
        const useMockProcessing = (isDevelopment && (isDevelopmentMockToken || isProductionMockToken)) || 
                                 (!isDevelopment && isDevelopmentMockToken);
        
        let customer, charge;

        if (useMockProcessing) {
          console.log(`${isDevelopment ? 'Development' : 'Production'} mode: Using mock Stripe processing`);
          // Create mock responses for development or test tokens in production
          customer = { id: `cus_mock_${Date.now()}` };
          charge = { 
            id: `ch_mock_${Date.now()}`,
            amount: Math.round(amount * 100),
            currency
          };
        } else {
          // Real token processing
          if (!process.env.STRIPE_SECRET_KEY) {
            console.error('Missing Stripe secret key');
            return res.status(500).json({ error: 'Payment processing is not properly configured' });
          }
          
          console.log(`${isDevelopment ? 'Development' : 'Production'} mode: Processing real payment with Stripe`);
          
          try {
            let tokenToUse = stripeToken;
            
            // No need to replace tokens in production for test tokens like tok_visa
            // They are valid Stripe test tokens and should work with the API
            // We only replace mock tokens in development
            if (isDevelopment && !isRealStripeToken) {
              tokenToUse = 'tok_visa'; // Stripe's test token for a successful payment
            }
            
            console.log('Using token for Stripe API:', tokenToUse);
            
            // Create a Stripe customer
            customer = await stripeInstance.customers.create({
              email,
              source: tokenToUse, // Token from Stripe.js
            });

            console.log('Stripe customer created:', customer.id);

            // Create a charge
            charge = await stripeInstance.charges.create({
              amount: Math.round(amount * 100), // Amount in cents, ensuring it's an integer
              currency,
              customer: customer.id,
              description: `NFT for hero ${heroId}`,
            });

            console.log('Stripe charge created:', charge.id);
          } catch (stripeError) {
            console.error('Stripe API error:', stripeError);
            return res.status(400).json({ 
              error: stripeError.message || 'Payment processing failed with Stripe'
            });
          }
        }

        // Create NFT
        const tokenId = uuidv4();
        const nft = {
          id: tokenId,
          heroId,
          createdAt: new Date(),
          metadata: {
            paymentId: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            status: 'confirmed',
            isTest: useMockProcessing
          },
          tokenURI: `https://api.olympus-hero.com/nft/${tokenId}`,
          ownerAddress: walletAddress || '0x0000000000000000000000000000000000000000',
        };

        // Save NFT to database and update hero
        await db.collection('nfts').insertOne(nft);
        
        // Update hero with NFT ID and payment status
        await heroDb.updateHero(heroId, {
          nftId: tokenId,
          paymentStatus: 'paid'
        });

        console.log('Payment processed successfully for hero:', heroId);
        console.log('NFT created with ID:', tokenId);
        
        res.status(200).json(nft);
      } catch (error) {
        console.error('Payment processing error:', error);
        if (error.type === 'StripeCardError') {
          // Card was declined
          return res.status(400).json({ error: error.message || 'Your card was declined' });
        }
        res.status(500).json({ error: error.message || 'Failed to process payment' });
      }
    });

    // Alternative: Endpoint to create Payment Intent
    app.post('/api/create-payment-intent', async (req, res) => {
      const { amount, currency, heroId, walletAddress, is_test, unlockChapters, paymentType } = req.body;

      try {
        // Check if OpenAI quota is exceeded before proceeding with payment
        if (checkOpenAIQuotaExceeded()) {
          console.error('Payment intent creation rejected: OpenAI quota exceeded');
          return res.status(429).json({ 
            error: 'OpenAI API quota exceeded', 
            errorType: 'quota_exceeded',
            message: "Cannot process payment at this time as the AI service is temporarily unavailable due to quota limitations. Please try again later."
          });
        }

        // Determine if we should use test mode
        // is_test from frontend OR we're in development mode on the server
        const useTestMode = is_test || process.env.NODE_ENV !== 'production';
        
        console.log(`Creating payment intent (${useTestMode ? 'TEST' : 'LIVE'} mode) for hero: ${heroId}, type: ${paymentType}`);
        
        // Use the appropriate Stripe key based on mode
        let stripeKey;
        if (useTestMode) {
          // In test mode, we must have a test key
          if (!process.env.STRIPE_TEST_SECRET_KEY) {
            console.error('No test secret key found but test mode is requested');
            return res.status(500).json({ error: 'Stripe test key is missing. Check server configuration.' });
          }
          stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
        } else {
          // In live mode, we must have a live key
          if (!process.env.STRIPE_SECRET_KEY) {
            console.error('No live secret key found but live mode is requested');
            return res.status(500).json({ error: 'Stripe live key is missing. Check server configuration.' });
          }
          stripeKey = process.env.STRIPE_SECRET_KEY;
        }
        
        // Create a new Stripe instance with the appropriate key
        const stripeClient = stripe(stripeKey);
        
        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents and ensure integer
          currency,
          metadata: { 
            heroId, 
            walletAddress,
            unlockChapters: unlockChapters ? 'true' : 'false',
            paymentType: paymentType || 'premium_upgrade',
            is_test: useTestMode ? 'true' : 'false' 
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'always'
          }
        });

        console.log(`Payment intent created successfully: ${paymentIntent.id} in ${useTestMode ? 'TEST' : 'LIVE'} mode`);
        try {
          const sid =
            typeof req.body?.sessionId === 'string' ? req.body.sessionId.slice(0, 80) : 'unknown';
          await insertAnalyticsEvent({
            event: 'checkout_open_server',
            sessionId: sid,
            path: '/api/create-payment-intent',
            properties: {
              heroId: String(heroId || ''),
              paymentType: String(paymentType || ''),
              amount: Number(amount),
            },
            userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
            ip: String(
              (typeof req.headers['x-forwarded-for'] === 'string'
                ? req.headers['x-forwarded-for'].split(',')[0].trim()
                : req.socket.remoteAddress) || ''
            ).slice(0, 45),
          });
        } catch (analyticsErr) {
          console.error('checkout_open_server analytics:', analyticsErr);
        }
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        
        // Check if this is a quota exceeded error
        if (isOpenAIQuotaError(error)) {
          // Mark the quota as exceeded for future requests
          setOpenAIQuotaExceeded(true);
          
          return res.status(429).json({ 
            error: 'OpenAI API quota exceeded', 
            errorType: 'quota_exceeded',
            message: "Cannot process payment at this time as the AI service is temporarily unavailable due to quota limitations. Please try again later."
          });
        }
        
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook to handle Payment Intent success
    app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('Payment intent succeeded:', paymentIntent.id);
        
        // Extract hero ID from metadata
        const { heroId } = paymentIntent.metadata;
        
        if (!heroId) {
          console.error('Missing heroId in payment intent metadata');
          return res.status(400).json({ error: 'Missing heroId in payment intent metadata' });
        }
        
        try {
          // Process the payment and create NFT
          await processPaymentAndCreateNFT(heroId, paymentIntent);
          console.log(`Payment processed for hero: ${heroId}`);
          try {
            await insertAnalyticsEvent({
              event: 'payment_success_webhook',
              sessionId: 'stripe_webhook',
              path: '/api/webhook',
              properties: {
                heroId: String(heroId),
                paymentIntentId: String(paymentIntent.id || ''),
              },
              userAgent: 'stripe_webhook',
              ip: '',
            });
          } catch (analyticsErr) {
            console.error('webhook analytics:', analyticsErr);
          }
        } catch (error) {
          console.error('Error processing payment webhook:', error);
        }
      }

      res.json({ received: true });
    });

    // Authentication Routes
    app.post('/api/auth/register', async (req, res) => {
      try {
        console.log('Registration request received:', { email: req.body?.email, name: req.body?.name });
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
          console.log('Missing required fields');
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }
        
        console.log('Calling registerUser...');
        const user = await registerUser(email, password, name);
        console.log('User registered successfully:', user.userId);
        try {
          const sid = typeof req.body?.sessionId === 'string' ? req.body.sessionId.slice(0, 80) : 'unknown';
          await insertAnalyticsEvent({
            event: 'register_success_server',
            sessionId: sid,
            path: '/api/auth/register',
            properties: { userId: user.userId },
            userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
            ip: String(
              (typeof req.headers['x-forwarded-for'] === 'string'
                ? req.headers['x-forwarded-for'].split(',')[0].trim()
                : req.socket.remoteAddress) || ''
            ).slice(0, 45),
          });
        } catch (analyticsErr) {
          console.error('register analytics:', analyticsErr);
        }
        res.status(201).json({ user });
      } catch (error) {
        console.error('Error registering user:', error);
        console.error('Error stack:', error.stack);
        const statusCode = error.message.includes('already exists') ? 409 : 400;
        if (!res.headersSent) {
          res.status(statusCode).json({ error: error.message || 'Registration failed' });
        }
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const { token, user } = await loginUser(email, password);
        return res.json({ token, user });
      } catch (error) {
        console.error('Error logging in:', error);
        return res.status(401).json({ error: error.message });
      }
    });

    // Protected route to get user profile
    app.get('/api/user', authMiddleware, async (req, res) => {
      const user = await getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ user });
    });

    // Hero Routes (now protected by authentication)
    app.post('/api/heroes', authMiddleware, async (req, res) => {
      try {
        const user = req.user;
        const account = await getUserById(user.userId);
        if (!account) {
          return res.status(401).json({
            error: 'Session invalid',
            message: 'Your account was not found. Please sign out and sign in again.',
          });
        }
        /** Supports flat JSON, legacy { body: "<json string>" }, or legacy { body: { ... } } */
        let data;
        const raw = req.body;
        if (!raw || typeof raw !== 'object') {
          return res.status(400).json({ error: 'Request body is required' });
        }
        if (typeof raw.body === 'string') {
          try {
            data = JSON.parse(raw.body);
          } catch (e) {
            console.error('Hero create: invalid legacy body string', e);
            return res.status(400).json({ error: 'Invalid hero payload (legacy body string)' });
          }
        } else if (raw.body && typeof raw.body === 'object') {
          data = raw.body;
        } else if (raw.heroName && raw.birthdate && raw.heroId) {
          data = {
            heroName: raw.heroName,
            birthdate: raw.birthdate,
            heroId: raw.heroId,
          };
        } else {
          return res.status(400).json({
            error: 'Birth date, hero name, and hero id are required',
          });
        }

        if (!data.birthdate || !data.heroName || !data.heroId) {
          return res.status(400).json({ error: 'Birth date, hero name, and hero id are required' });
        }

        const heroNameClean = String(data.heroName).trim();
        const heroIdClean = String(data.heroId).trim();
        if (!heroNameClean || !heroIdClean) {
          return res.status(400).json({ error: 'Hero name and hero id must be non-empty' });
        }

        // Check if user already has a non-premium hero
        const existingHeroes = await heroDb.getHeroesByUserId(user.userId);
        const hasNonPremiumHero = existingHeroes.some(hero => hero.paymentStatus !== 'paid');
        
        if (hasNonPremiumHero) {
          return res.status(403).json({ 
            error: 'You already have a non-premium hero', 
            message: 'You can only have one non-premium hero at a time. Please purchase your existing hero to generate a new one.'
          });
        }
        
        // Parse the birthdate
        const dob = new Date(data.birthdate);
        if (Number.isNaN(dob.getTime())) {
          return res.status(400).json({ error: 'Invalid birth date' });
        }

        // Calculate zodiac signs
        const westernZodiac = calculate_western_zodiac(dob);
        const chineseZodiac = calculate_chinese_zodiac(dob);
        
        // Create hero object
        const hero = {
          id: heroIdClean,
          userid: user.userId,
          name: heroNameClean,
          birthdate: dob,
          westernZodiac,
          chineseZodiac,
          created: new Date(),
          status: 'pending', // pending, processing, completed
          images: [],
          backstory: '',
          paymentStatus: 'unpaid',
          nftId: null,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          avatarVersion: 1,
          avatarHistory: [],
        };
        
        // Store the hero in database
        await heroDb.createHero(hero);
        
        // Associate hero with user
        await addHeroToUser(user.userId, heroIdClean);
        
        // Return the hero ID
        return res.status(201).json({ 
          hero,
          message: 'Hero creation initiated. Images and backstory will be generated shortly.'
        });
      } catch (error) {
        console.error('Error creating hero:', error);
        if (error?.message === 'USER_ACCOUNT_MISSING') {
          return res.status(401).json({
            error: 'Session invalid',
            message: 'Your account was not found. Please sign out and sign in again.',
          });
        }
        if (error?.code === 11000) {
          return res.status(409).json({
            error: 'hero_id_conflict',
            message: 'This hero id is already in use. Please try generating again.',
          });
        }
        return res.status(500).json({ error: 'Failed to create hero' });
      }
    });

    // Get hero by ID (allowed for authenticated users who own the hero)
    app.get('/api/heroes/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;

      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Share check' });
      }
      
      const hero = await heroDb.findHeroById(id);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }
      
      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this hero' });
      }
      
      return res.json({
        ...hero,
        loreJournal: normalizeLoreJournal(hero),
      });
    });

    app.post('/api/heroes/:id/lore', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'invalid_session' });
      }
      const result = await postHeroLore({
        heroDb,
        heroId: id,
        userId,
        body: req.body,
      });
      return res.status(result.status).json(result.body);
    });

    app.patch('/api/heroes/:id/lore/:loreId', authMiddleware, async (req, res) => {
      const { id, loreId } = req.params;
      const userId = req.user.userId;
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'invalid_session' });
      }
      const result = await patchHeroLore({
        heroDb,
        heroId: id,
        userId,
        loreId,
        body: req.body,
      });
      return res.status(result.status).json(result.body);
    });

    app.delete('/api/heroes/:id/lore/:loreId', authMiddleware, async (req, res) => {
      const { id, loreId } = req.params;
      const userId = req.user.userId;
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'invalid_session' });
      }
      const result = await deleteHeroLore({
        heroDb,
        heroId: id,
        userId,
        loreId,
      });
      return res.status(result.status).json(result.body);
    });

    app.post('/api/heroes/setpremium/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;

      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Share check' });
      }

      const hero = await heroDb.findHeroById(id);

      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }

      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this hero' });
      }

      const updatedHero = await heroDb.upgradeHero(id);

      try {
        await promoteStorybookAfterPremiumPayment(id);
      } catch (promoteErr) {
        console.error('promoteStorybookAfterPremiumPayment (setpremium):', promoteErr);
      }

      return res.json(updatedHero);
    });

    app.post('/api/heroes/unlockstory/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;

      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Share check' });
      }

      const hero = await heroDb.findHeroById(id);

      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }

      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this hero' });
      }

      const updatedStoryBook = await storyBookDb.incrementUnlockedChapters(id);

      return res.json(updatedStoryBook);
    });

    // Generate hero images and backstory
    app.post('/api/heroes/generate/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;

      const hero = await heroDb.findHeroById(id);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }

      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to modify this hero' });
      }

      // Check if OpenAI quota is exceeded before proceeding with generation
      if (checkOpenAIQuotaExceeded()) {
        console.error('Hero generation rejected: OpenAI quota exceeded');
        return res.status(429).json({ 
          error: 'OpenAI API quota exceeded', 
          errorType: 'quota_exceeded',
          message: "Cannot generate hero content at this time as the AI service is temporarily unavailable due to quota limitations. Please try again later."
        });
      }

      const hasGeneratedContent =
        Array.isArray(hero.images) &&
        hero.images.length > 0 &&
        typeof hero.backstory === 'string' &&
        hero.backstory.trim().length > 0;
      if (hero.status === 'completed' && hasGeneratedContent) {
        const existing = await heroDb.findHeroById(id);
        return res.json({
          message: 'Hero generation completed',
          hero: existing,
        });
      }
      if (hero.status === 'processing') {
        return res.status(202).json({
          message: 'Generation in progress',
          pending: true,
          hero,
        });
      }

      try {
        // Update status
        hero.status = 'processing';
        await heroDb.updateHero(id, { status: 'processing' });

        // Generate images - passing heroId to the function
        const viewAngles = ['front', 'profile', 'action'];
        const imagePromises = viewAngles.map(angle =>
            generateOpenAIImages(hero.name, hero.westernZodiac, hero.chineseZodiac, angle, id)
        );

        // Wait for all images to be generated
        const images = await Promise.all(imagePromises);

        // Generate backstory
        const backstory = await generateBackstory(hero.name, hero.westernZodiac, hero.chineseZodiac);

        // Update hero with images and backstory
        await heroDb.updateHero(id, {
          images,
          backstory,
          status: 'completed',
        });

        try {
          await ensureHeroStorybookChapterOne(id);
        } catch (syncErr) {
          console.error('Storybook chapter sync after hero generation failed:', syncErr);
        }

        // Get the updated hero
        const updatedHero = await heroDb.findHeroById(id);

        return res.json({
          message: 'Hero generation completed',
          hero: updatedHero,
        });
      } catch (error) {
        console.error('Error generating hero content:', error);
        
        if (isOpenAIAuthOrConfigError(error)) {
          await heroDb.updateHero(id, { status: 'error', error_type: 'openai_config' });
          return res.status(503).json({
            error: 'OpenAI API authentication or configuration failed',
            errorType: 'openai_config',
            message:
              'The AI service rejected the request (invalid or missing API key on the server). Update OPENAI_API_KEY in the deployment environment and retry.',
          });
        }

        // Check if this is a quota exceeded error
        if (isOpenAIQuotaError(error)) {
          // Mark the quota as exceeded for future requests
          setOpenAIQuotaExceeded(true);
          
          await heroDb.updateHero(id, { status: 'error', error_type: 'quota_exceeded' });
          
          return res.status(429).json({ 
            error: 'OpenAI API quota exceeded', 
            errorType: 'quota_exceeded',
            message: "Cannot generate hero content at this time as the AI service is temporarily unavailable due to quota limitations. Please try again later."
          });
        }
        
        await heroDb.updateHero(id, { status: 'error' });
        return res.status(500).json({ error: 'Failed to generate hero content' });
      }
    });


    // Process payment with Stripe and create NFT
    app.post('/api/heroes/:id/payment', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const { paymentDetails } = req.body;
      const userId = req.user.userId;
      
      const hero = await heroDb.findHeroById(id);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }
      
      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to modify this hero' });
      }
      
      try {
        // Process payment and create NFT
        const nft = await processPaymentAndCreateNFT(id, paymentDetails);
        
        // Update hero with NFT ID and payment status
        await heroDb.updateHero(id, {
          nftId: nft.id,
          paymentStatus: 'paid'
        });
        
        // Get updated hero
        const updatedHero = await heroDb.findHeroById(id);
        
        return res.json({ 
          message: 'Payment processed successfully and NFT created',
          hero: updatedHero,
          nft
        });
      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    });

    // Get NFT details for a hero
    app.get('/api/heroes/:id/nft', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const hero = await heroDb.findHeroById(id);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }
      
      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to view this hero' });
      }
      
      if (!hero.nftId) {
        return res.status(404).json({ error: 'No NFT found for this hero' });
      }
      
      const nft = await getNFTById(hero.nftId);
      if (!nft) {
        return res.status(404).json({ error: 'NFT not found' });
      }
      
      return res.json({ nft });
    });

    // Sharing Routes
    // Create a shared link for a hero
    app.post('/api/heroes/:id/share', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;
      const { expiresAt, maxAccesses } = req.body;
      
      const hero = await heroDb.findHeroById(id);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }
      
      // Check if the user owns this hero
      if (hero.userid !== userId) {
        return res.status(403).json({ error: 'You do not have permission to share this hero' });
      }
      
      // Create the shared link
      const sharedLink = await createSharedLink(id, userId, { expiresAt, maxAccesses });
      
      return res.status(201).json({ 
        message: 'Shared link created successfully',
        sharedLink
      });
    });

    // Get all shared links for a user
    app.get('/api/user/shares', authMiddleware, async (req, res) => {
      const userId = req.user.userId;
      
      const sharedLinks = await getSharedLinksByUser(userId);
      
      return res.json({ sharedLinks });
    });

    // Deactivate a shared link
    app.delete('/api/shares/:id', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const success = await deactivateSharedLink(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: 'Shared link not found or you do not have permission to deactivate it' });
      }
      
      return res.json({ message: 'Shared link deactivated successfully' });
    });

    // Public access to shared hero
    app.get('/api/share/:shareId', async (req, res) => {
      const { shareId } = req.params;
      
      const result = await accessSharedHero(shareId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      
      // Get the hero data
      const hero = await heroDb.findHeroById(result.heroId);
      if (!hero) {
        return res.status(404).json({ error: 'Hero not found' });
      }
      
      // Only send limited information for shared heroes
      const sharedHeroData = {
        id: hero.id,
        name: hero.name,
        images: hero.images,
        backstory: hero.backstory,
        westernZodiac: hero.westernZodiac,
        chineseZodiac: hero.chineseZodiac,
        isShared: true
      };

      try {
        const fwd = req.headers['x-forwarded-for'];
        const ip =
          typeof fwd === 'string'
            ? fwd.split(',')[0].trim()
            : req.socket.remoteAddress;
        await insertAnalyticsEvent({
          event: 'share_visit',
          sessionId: 'server_share',
          path: `/api/share/${shareId}`,
          properties: { shareId: String(shareId), heroId: String(hero.id) },
          userAgent: String(req.headers['user-agent'] || '').slice(0, 400),
          ip: String(ip || '').slice(0, 45),
        });
      } catch (analyticsErr) {
        console.error('share_visit analytics:', analyticsErr);
      }
      
      return res.json({ 
        message: 'Shared hero accessed successfully',
        hero: sharedHeroData
      });
    });

    // Get all heroes for the current logged-in user
    app.get('/api/user/heroes', authMiddleware, async (req, res) => {
      try {
        const userId = req.user.userId;
        
        // Get all heroes for this user
        const heroes = await heroDb.getHeroesByUserId(userId);
        
        return res.json({ 
          heroes
        });
      } catch (error) {
        console.error('Error fetching user heroes:', error);
        return res.status(500).json({ error: 'Failed to fetch heroes' });
      }
    });

    // Create and download a zip of all hero assets
    app.get('/api/heroes/:id/download', authMiddleware, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.userId;

      try {
        // Get the hero
        const hero = await heroDb.findHeroById(id);
        
        if (!hero) {
          return res.status(404).json({ error: 'Hero not found' });
        }

        // Check if user owns the hero
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission to download this hero' });
        }

        // Check if hero is paid
        if (hero.paymentStatus !== 'paid') {
          return res.status(403).json({ error: 'You need to purchase this hero to download its assets' });
        }

        // Create the zip file
        const { filePath, fileName } = await createHeroZip(hero);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Delete the temp file after download completes
        fileStream.on('close', () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting temp file: ${err.message}`);
          });
        });
      } catch (error) {
        console.error('Error creating download:', error);
        res.status(500).json({ error: 'Failed to create download' });
      }
    });

    // Shared Story Routes
    app.post('/api/shared-story/create', authMiddleware, async (req, res) => {
      try {
        const { heroId, mode, scriptTemplateId, storyArcId } = req.body;
        const userId = req.user.userId;
        
        if (!heroId) {
          return res.status(400).json({ error: 'Hero ID is required' });
        }
        
        // Get the hero data
        const hero = await heroDb.findHeroById(heroId);
        if (!hero) {
          return res.status(404).json({ error: 'Hero not found' });
        }
        
        // Verify the hero belongs to the user
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission to use this hero' });
        }
        
        // Check if hero is premium (has been paid for)
        if (hero.paymentStatus !== 'paid') {
          return res.status(403).json({ error: 'Only premium heroes can create shared story rooms' });
        }
        
        const roomId = await createSharedStoryRoom(hero, {
          mode,
          scriptTemplateId,
          storyArcId,
        });

        appendInitialRoomNarrator(io, roomId).catch((err) => {
          console.error('Initial shared-story narrator:', err?.message || err);
        });

        return res.status(201).json({
          roomId,
          message: 'Shared story room created successfully',
        });
      } catch (error) {
        console.error('Error creating shared story room:', error);
        return res.status(500).json({ error: 'Failed to create shared story room' });
      }
    });

    app.get('/api/shared-story/story-arcs', async (_req, res) => {
      try {
        return res.json({ arcs: listStoryArcSummaries() });
      } catch (e) {
        console.error('story-arcs:', e);
        return res.status(500).json({ error: 'Failed to list story arcs' });
      }
    });

    app.get('/api/shared-story/:roomId', async (req, res) => {
      try {
        const { roomId } = req.params;
        
        if (!roomId) {
          return res.status(400).json({ error: 'Room ID is required' });
        }
        
        // Get the shared story room
        const room = await getSharedStoryRoom(roomId);
        if (!room) {
          return res.status(404).json({ error: 'Shared story room not found' });
        }
        
        return res.json({
          roomId: room.id,
          title: room.title,
          mode: room.mode || 'shared_story',
          agentDriveEnabled: !!room.agentDriveEnabled,
          ownerUserId: room.ownerUserId,
          participants: room.participants.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            isPremium: p.isPremium
          })),
          created: room.created,
          storyArc: summarizeStoryArcForRoom(room),
          voiceNarrationAvailable: isElevenLabsConfigured(),
        });
      } catch (error) {
        console.error('Error getting shared story room:', error);
        return res.status(500).json({ error: 'Failed to get shared story room details' });
      }
    });

    app.get(
      '/api/shared-story/:roomId/messages/:messageId/narration',
      async (req, res) => {
        try {
          const { roomId, messageId } = req.params;
          if (!isElevenLabsConfigured()) {
            return res.status(503).json({
              error: 'narration_unavailable',
              message: 'Voice narration is not configured on this server.',
            });
          }
          const room = await getSharedStoryRoom(roomId);
          if (!room) {
            return res.status(404).json({ error: 'Room not found' });
          }
          const message = (room.messages || []).find((m) => m.id === messageId);
          if (!message) {
            return res.status(404).json({ error: 'Message not found' });
          }
          if (message.sender?.id !== 'system' || message.sender?.name !== 'Cosmic Narrator') {
            return res
              .status(400)
              .json({ error: 'Only Cosmic Narrator passages can be voiced' });
          }
          const text = narratorHtmlToSpokenText(message.content);
          if (!text) {
            return res.status(400).json({ error: 'No narratable text in this passage' });
          }
          const audio = await getOrSynthesizeNarration({ roomId, messageId, text });
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', String(audio.length));
          res.setHeader('Cache-Control', 'private, max-age=86400');
          res.setHeader('Accept-Ranges', 'none');
          return res.end(audio);
        } catch (error) {
          console.error('shared-story narration error:', error?.message || error);
          const status =
            typeof error?.status === 'number' && error.status >= 400 && error.status < 600
              ? error.status >= 500
                ? 502
                : error.status
              : 500;
          if (!res.headersSent) {
            return res.status(status).json({
              error: 'narration_failed',
              message: 'The Cosmic Narrator could not voice this passage right now.',
            });
          }
          return res.end();
        }
      }
    );

    // List all active shared story rooms
    app.get('/api/shared-story', async (req, res) => {
      try {
        // Get all shared story rooms
        const rooms = await listSharedStoryRooms();
        
        // Return rooms list
        return res.json(rooms);
      } catch (error) {
        console.error('Error listing shared story rooms:', error);
        return res.status(500).json({ error: 'Failed to list shared story rooms' });
      }
    });

    const agentProposalRate = new Map();

    app.post(
      '/api/heroes/:id/agent-drive/tokens',
      authMiddleware,
      async (req, res) => {
        try {
          const { id } = req.params;
          const userId = req.user.userId;
          const { roomId, label, expiresInDays } = req.body;
          const hero = await heroDb.findHeroById(id);
          if (!hero) return res.status(404).json({ error: 'Hero not found' });
          if (hero.userid !== userId) {
            return res.status(403).json({ error: 'You do not have permission' });
          }
          if (hero.paymentStatus !== 'paid') {
            return res.status(403).json({ error: 'Premium hero required' });
          }
          const issued = await issueAgentDriveToken({
            ownerUserId: userId,
            heroId: id,
            roomId: roomId || null,
            label,
            expiresInDays,
          });
          return res.status(201).json({
            tokenId: issued.tokenId,
            token: issued.plaintextToken,
            expiresAt: issued.expiresAt,
          });
        } catch (e) {
          console.error('agent-drive token create:', e);
          return res.status(500).json({ error: 'Failed to create token' });
        }
      }
    );

    app.get('/api/heroes/:id/agent-drive/tokens', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.userId;
        const hero = await heroDb.findHeroById(id);
        if (!hero) return res.status(404).json({ error: 'Hero not found' });
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission' });
        }
        const tokens = await listAgentDriveTokensForHero(id);
        return res.json({ tokens });
      } catch (e) {
        console.error('agent-drive token list:', e);
        return res.status(500).json({ error: 'Failed to list tokens' });
      }
    });

    app.post(
      '/api/heroes/:id/agent-drive/tokens/:tokenId/revoke',
      authMiddleware,
      async (req, res) => {
        try {
          const { id, tokenId } = req.params;
          const userId = req.user.userId;
          const hero = await heroDb.findHeroById(id);
          if (!hero) return res.status(404).json({ error: 'Hero not found' });
          if (hero.userid !== userId) {
            return res.status(403).json({ error: 'You do not have permission' });
          }
          const ok = await revokeAgentDriveToken(tokenId, userId);
          if (!ok) return res.status(404).json({ error: 'Token not found' });
          return res.json({ message: 'Token revoked' });
        } catch (e) {
          console.error('agent-drive token revoke:', e);
          return res.status(500).json({ error: 'Failed to revoke token' });
        }
      }
    );

    app.post(
      '/api/shared-story/:roomId/agent-drive/enable',
      authMiddleware,
      async (req, res) => {
        try {
          const { roomId } = req.params;
          const userId = req.user.userId;
          const room = await getSharedStoryRoom(roomId);
          if (!room) return res.status(404).json({ error: 'Room not found' });
          if (room.ownerUserId !== userId) {
            return res.status(403).json({ error: 'Only the room owner can enable Agent Drive' });
          }
          await mutateSharedStoryRoom(roomId, (r) => {
            r.agentDriveEnabled = true;
          });
          return res.json({ message: 'Agent Drive enabled', agentDriveEnabled: true });
        } catch (e) {
          console.error('agent-drive enable:', e);
          return res.status(500).json({ error: 'Failed to enable Agent Drive' });
        }
      }
    );

    app.post(
      '/api/shared-story/:roomId/agent-drive/disable',
      authMiddleware,
      async (req, res) => {
        try {
          const { roomId } = req.params;
          const userId = req.user.userId;
          const room = await getSharedStoryRoom(roomId);
          if (!room) return res.status(404).json({ error: 'Room not found' });
          if (room.ownerUserId !== userId) {
            return res.status(403).json({ error: 'Only the room owner can disable Agent Drive' });
          }
          await mutateSharedStoryRoom(roomId, (r) => {
            r.agentDriveEnabled = false;
          });
          return res.json({ message: 'Agent Drive disabled', agentDriveEnabled: false });
        } catch (e) {
          console.error('agent-drive disable:', e);
          return res.status(500).json({ error: 'Failed to disable Agent Drive' });
        }
      }
    );

    app.post(
      '/api/shared-story/:roomId/skirmish/resolve',
      authMiddleware,
      async (req, res) => {
        try {
          const { roomId } = req.params;
          const { outcome } = req.body;
          const userId = req.user.userId;
          const room = await getSharedStoryRoom(roomId);
          if (!room) return res.status(404).json({ error: 'Room not found' });
          if (room.mode !== 'skirmish') {
            return res.status(400).json({ error: 'Room is not a skirmish' });
          }
          const heroId = req.body.heroId;
          if (!heroId) return res.status(400).json({ error: 'heroId required' });
          const hero = await heroDb.findHeroById(heroId);
          if (!hero || hero.userid !== userId) {
            return res.status(403).json({ error: 'Invalid hero' });
          }
          const participant = room.participants.find((p) => p.id === heroId);
          if (!participant) {
            return res.status(403).json({ error: 'Hero not in this room' });
          }
          await mutateSharedStoryRoom(roomId, (r) => {
            if (!r.skirmishState) {
              r.skirmishState = { round: 1, status: 'active' };
            }
            r.skirmishState.status = outcome === 'win' ? 'won' : 'lost';
            r.skirmishState.round = (r.skirmishState.round || 1) + 1;
          });
          let progression = null;
          if (outcome === 'win') {
            progression = await applyProgressEvent(heroId, 'skirmish_win', {
              source: 'skirmish',
              roomId,
            });
          }
          return res.json({ ok: true, roomId, progression });
        } catch (e) {
          console.error('skirmish resolve:', e);
          return res.status(500).json({ error: 'Failed to resolve skirmish' });
        }
      }
    );

    app.post(
      '/api/shared-story/:roomId/scripted/advance',
      authMiddleware,
      async (req, res) => {
        try {
          const { roomId } = req.params;
          const userId = req.user.userId;
          const { heroId } = req.body;
          if (!heroId) return res.status(400).json({ error: 'heroId required' });
          const room = await getSharedStoryRoom(roomId);
          if (!room) return res.status(404).json({ error: 'Room not found' });
          if (room.mode !== 'scripted_story') {
            return res.status(400).json({ error: 'Room is not scripted' });
          }
          if (room.ownerUserId !== userId) {
            return res.status(403).json({ error: 'Only the session owner can advance the script' });
          }
          const hero = await heroDb.findHeroById(heroId);
          if (!hero || hero.userid !== userId) {
            return res.status(403).json({ error: 'Invalid hero' });
          }
          let progression = null;
          await mutateSharedStoryRoom(roomId, (r) => {
            if (!r.scriptedState) {
              r.scriptedState = { templateId: 'generic_arc', stepIndex: 0, beats: [] };
            }
            const tmpl = getStoryArcTemplate(r.scriptedState.templateId);
            if (!Array.isArray(r.scriptedState.beats) || r.scriptedState.beats.length === 0) {
              r.scriptedState.beats = tmpl.beats.map((b) => b.key);
            }
            const maxIdx = Math.max(0, tmpl.beats.length - 1);
            r.scriptedState.stepIndex = Math.min(
              maxIdx,
              (r.scriptedState.stepIndex || 0) + 1
            );
          });
          progression = await applyProgressEvent(heroId, 'scripted_beat', {
            source: 'scripted_story',
            roomId,
          });
          return res.json({ ok: true, progression });
        } catch (e) {
          console.error('scripted advance:', e);
          return res.status(500).json({ error: 'Failed to advance script' });
        }
      }
    );

    app.get('/api/heroes/:id/progression', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.userId;
        const hero = await heroDb.findHeroById(id);
        if (!hero) return res.status(404).json({ error: 'Hero not found' });
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission' });
        }
        const storyBook = await storyBookDb.findStoryBookByHeroId(id);
        return res.json({
          heroId: id,
          level: hero.level ?? 1,
          xp: hero.xp ?? 0,
          xpToNextLevel: hero.xpToNextLevel ?? 100,
          avatarVersion: hero.avatarVersion ?? 1,
          storyBook: storyBook
            ? {
                id: storyBook.id,
                legendaryRank: storyBook.legendaryRank ?? storyBook.chapters_unlocked_count,
                chapters_unlocked_count: storyBook.chapters_unlocked_count,
                chapters_total_count: storyBook.chapters_total_count,
              }
            : null,
        });
      } catch (e) {
        console.error('progression get:', e);
        return res.status(500).json({ error: 'Failed to load progression' });
      }
    });

    // StoryBook Routes
    app.get('/api/heroes/:heroId/storybook', authMiddleware, async (req, res) => {
      try {
        const { heroId } = req.params;
        const userId = req.user.userId;
        
        // Get the hero data
        const hero = await heroDb.findHeroById(heroId);
        if (!hero) {
          return res.status(404).json({ error: 'Hero not found' });
        }
        
        // Verify the hero belongs to the user
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission to access this hero' });
        }
        
        // Check if we need to unlock daily chapters (for premium heroes)
        const isPremium = hero.paymentStatus === 'paid';
        
        // Get or create the storybook
        let storyBook = await getOrCreateStoryBook(heroId, isPremium);

        // Paid hero but Mongo still on free-tier story shape (legacy setpremium/webhook gap)
        if (isPremium) {
          try {
            await promoteStorybookAfterPremiumPayment(heroId);
          } catch (promoteErr) {
            console.warn(
              'promoteStorybookAfterPremiumPayment (GET /storybook):',
              promoteErr?.message || promoteErr
            );
          }
          storyBook = (await storyBookDb.findStoryBookByHeroId(heroId)) || storyBook;
          await checkAndUnlockDailyChapters(storyBook.id);
          storyBook = (await storyBookDb.findStoryBookByHeroId(heroId)) || storyBook;
        }

        const chapters = await getStoryBookChapters(storyBook.id);
        
        return res.status(200).json({
          storyBook,
          chapters
        });
      } catch (error) {
        console.error('Error fetching storybook:', error);
        return res.status(500).json({ error: 'Failed to fetch storybook' });
      }
    });

    // Unlock chapters
    app.post('/api/storybook/:storyBookId/unlock', authMiddleware, async (req, res) => {
      try {
        const { storyBookId } = req.params;
        const userId = req.user.userId;
        const { count = 10 } = req.body;
        
        // Find the storybook
        const storyBook = await storyBookDb.findStoryBookById(storyBookId);
        if (!storyBook) {
          return res.status(404).json({ error: 'Storybook not found' });
        }
        
        // Find the hero to verify ownership
        const hero = await heroDb.findHeroById(storyBook.heroId);
        if (!hero) {
          return res.status(404).json({ error: 'Hero not found' });
        }
        
        // Verify the hero belongs to the user
        if (hero.userid !== userId) {
          return res.status(403).json({ error: 'You do not have permission to unlock chapters for this hero' });
        }
        
        // Unlock chapters
        const updatedStoryBook = await unlockChapters(storyBookId, count);
        
        // Get the updated chapters
        const chapters = await getStoryBookChapters(storyBookId);
        
        return res.status(200).json({
          storyBook: updatedStoryBook,
          chapters
        });
      } catch (error) {
        console.error('Error unlocking chapters:', error);
        return res.status(500).json({ error: 'Failed to unlock chapters' });
      }
    });

    // Set hero as premium and create a premium storybook
    app.post('/api/heroes/:heroId/set-premium', authMiddleware, async (req, res) => {
      try {
        const { heroId } = req.params;
        const userId = req.user.userId;
        
        // Verify admin permission (implement proper admin check)
        // This is a simplified check - implement proper admin validation
        if (!req.user.isAdmin) {
          return res.status(403).json({ error: 'Admin permission required' });
        }
        
        // Get the hero data
        const hero = await heroDb.findHeroById(heroId);
        if (!hero) {
          return res.status(404).json({ error: 'Hero not found' });
        }
        
        // Create or upgrade the storybook
        const storyBook = await getOrCreateStoryBook(heroId, true);
        
        return res.status(200).json({
          message: 'Hero set as premium successfully',
          storyBook
        });
      } catch (error) {
        console.error('Error setting hero as premium:', error);
        return res.status(500).json({ error: 'Failed to set hero as premium' });
      }
    });

    // Hook payment processing to unlock chapters
    app.post('/api/webhook/payment-success', async (req, res) => {
      try {
        const { heroId, shouldUnlockChapters, paymentIntent } = req.body;
        
        // Validate the webhook signature (simplified - implement proper validation)
        // This would normally check digital signatures, etc.
        
        // Process the payment and create NFT
        await processPaymentAndCreateNFT(heroId, paymentIntent);
        
        // Get the storybook
        const storyBook = await storyBookDb.findStoryBookByHeroId(heroId);
        
        if (storyBook && shouldUnlockChapters) {
          // Unlock 3 chapters instead of 10
          await unlockChapters(storyBook.id, 3);
        }
        
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error processing payment webhook:', error);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    });

    // Daily job to unlock chapters
    // This would be called by a cron job in a production environment
    app.post('/api/admin/unlock-daily-chapters', async (req, res) => {
      try {
        // Get all premium storybooks
        const db = await initializeDB();
        const premiumStorybooks = await db.collection('storybooks')
          .find({ 
            is_premium: true,
            chapters_unlocked_count: { $lt: "$chapters_total_count" }
          })
          .toArray();
        
        const results = [];
        
        // Process each storybook
        for (const storyBook of premiumStorybooks) {
          const result = await checkAndUnlockDailyChapters(storyBook.id);
          if (result) {
            results.push({
              storyBookId: storyBook.id,
              heroId: storyBook.heroId,
              chaptersUnlocked: result.chapters_unlocked_count - storyBook.chapters_unlocked_count
            });
          }
        }
        
        return res.status(200).json({
          message: `Processed ${premiumStorybooks.length} storybooks`,
          unlocked: results.length,
          results
        });
      } catch (error) {
        console.error('Error unlocking daily chapters:', error);
        return res.status(500).json({ error: 'Failed to unlock daily chapters' });
      }
    });

    // Direct chapter unlock after payment
    app.post('/api/storybook/:heroId/unlock-after-payment', async (req, res) => {
      try {
        const { heroId } = req.params;
        
        // Check if OpenAI quota is exceeded before proceeding
        if (checkOpenAIQuotaExceeded()) {
          console.error('Chapter unlock after payment rejected: OpenAI quota exceeded');
          return res.status(429).json({ 
            error: 'OpenAI API quota exceeded', 
            errorType: 'quota_exceeded',
            message: "Cannot unlock chapters at this time as the AI service is temporarily unavailable due to quota limitations. Your payment has been processed, but chapter generation will be delayed. Please try again later."
          });
        }
        
        // Find the storybook
        const storyBook = await storyBookDb.findStoryBookByHeroId(heroId);
        if (!storyBook) {
          return res.status(404).json({ error: 'Storybook not found' });
        }
        
        // Unlock 3 chapters instead of 10
        const chapters = await unlockChapters(storyBook.id, 3);
        
        // Get updated storybook and chapters
        const updatedStoryBook = await storyBookDb.findStoryBookById(storyBook.id);

        return res.status(200).json({ 
          message: 'Chapters unlocked successfully',
          storyBook: updatedStoryBook,
          chapters
        });
      } catch (error) {
        console.error('Error unlocking chapters after payment:', error);
        
        // Check if this is a quota exceeded error
        if (isOpenAIQuotaError(error)) {
          // Set the global flag
          setOpenAIQuotaExceeded(true);
          
          return res.status(429).json({ 
            error: 'OpenAI API quota exceeded', 
            errorType: 'quota_exceeded',
            message: "You have exceeded the OpenAI API quota. Your payment has been processed, but chapter generation will be delayed. Please try again later."
          });
        }
        
        return res.status(500).json({ error: 'Failed to unlock chapters' });
      }
    });

    // Check for daily chapters on login
    app.post('/api/user/login', async (req, res) => {
      // ... existing code ...
    });

    // Fix storybook chapter issues (admin or developer use)
    app.post('/api/admin/fix-storybook/:storyBookId?', authMiddleware, async (req, res) => {
      try {
        const { storyBookId } = req.params;
        const userId = req.user.userId;
        
        // Check if user is admin (simplified - implement proper admin check)
        const user = await userDb.findUserById(userId);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: 'Only admins can perform this operation' });
        }
        
        let result = [];
        
        // If a specific storyBookId is provided, fix just that one
        if (storyBookId) {
          const storyBook = await storyBookDb.findStoryBookById(storyBookId);
          if (!storyBook) {
            return res.status(404).json({ error: 'Storybook not found' });
          }
          
          const updatedStoryBook = await fixStoryBookChapters(storyBookId);
          result.push({
            storyBookId,
            success: true,
            message: `Fixed storybook ${storyBookId}`
          });
        } else {
          // Fix all storybooks if no ID provided
          const allStoryBooks = await storyBookDb.getAllStoryBooks();
          
          for (const storyBook of allStoryBooks) {
            try {
              await fixStoryBookChapters(storyBook.id);
              result.push({
                storyBookId: storyBook.id,
                success: true,
                message: `Fixed storybook ${storyBook.id}`
              });
            } catch (error) {
              result.push({
                storyBookId: storyBook.id,
                success: false,
                error: error.message
              });
            }
          }
        }
        
        return res.status(200).json({
          message: 'Storybook fix operation completed',
          results: result
        });
      } catch (error) {
        console.error('Error fixing storybooks:', error);
        return res.status(500).json({ error: 'Failed to fix storybooks' });
      }
    });

    // Initialize Socket.IO and configure it
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Authenticate socket connection
      socket.on('authenticate', async (data) => {
        try {
          const { token, heroId } = data;
          // Verify JWT token
          // This is a simplified version - in production you'd want to use the full authMiddleware
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.userId;
          
          // If heroId is provided, get the hero data
          let hero = null;
          if (heroId) {
            hero = await heroDb.findHeroById(heroId);
            // Verify the hero belongs to the user
            if (hero && hero.userid !== userId) {
              socket.emit('authentication_error', { message: 'You do not have permission to use this hero' });
              return;
            }
          }
          
          // Store user and hero info in socket object
          socket.userId = userId;
          socket.heroId = heroId;
          socket.isPremium = hero ? hero.paymentStatus === 'paid' : false;
          socket.join(`user:${userId}`);
          
          // Notify client of successful authentication
          socket.emit('authenticated', { userId, heroId });
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });

      socket.on('authenticate_agent', async (data) => {
        try {
          const tokenStr = data?.token;
          const v = await verifyAgentDriveToken(tokenStr);
          if (!v) {
            socket.emit('authentication_error', { message: 'Invalid agent token' });
            return;
          }
          const hero = await heroDb.findHeroById(v.heroId);
          if (!hero) {
            socket.emit('authentication_error', { message: 'Hero not found' });
            return;
          }
          socket.isAgentConnection = true;
          socket.agentHeroId = v.heroId;
          socket.agentTokenId = v.tokenRecord.id;
          socket.agentOwnerUserId = v.ownerUserId;
          socket.heroId = v.heroId;
          socket.isPremium = hero.paymentStatus === 'paid';
          socket.join(`user:${v.ownerUserId}`);
          socket.emit('authenticated_agent', {
            heroId: v.heroId,
            ownerUserId: v.ownerUserId,
          });
        } catch (error) {
          console.error('Socket agent authentication error:', error);
          socket.emit('authentication_error', { message: 'Agent authentication failed' });
        }
      });
      
      // Join a shared story room
      socket.on('join_room', async (data) => {
        try {
          const { roomId } = data;
          
          if (!socket.heroId) {
            socket.emit('error', { message: 'You must authenticate before joining a room' });
            return;
          }
          if (!socket.userId && !socket.isAgentConnection) {
            socket.emit('error', { message: 'You must authenticate before joining a room' });
            return;
          }
          
          // Get the hero data
          const hero = await heroDb.findHeroById(socket.heroId);
          if (!hero) {
            socket.emit('error', { message: 'Hero not found' });
            return;
          }

          if (socket.isAgentConnection && socket.agentHeroId !== socket.heroId) {
            socket.emit('error', { message: 'Agent token does not match hero' });
            return;
          }

          socket.isPremium = hero.paymentStatus === 'paid';
          
          // Join the room (as participant if premium, spectator if not)
          const result = await joinSharedStoryRoom(roomId, {
            id: socket.heroId,
            userId: hero.userid,
            name: hero.name,
            avatar: hero.images[0]?.url || null,
            backstory: hero.backstory,
            isPremium: socket.isPremium
          });
          
          // Join the socket.io room
          socket.join(roomId);
          socket.roomId = roomId;
          
          // Notify client of successful join
          socket.emit('room_joined', { 
            roomId,
            isPremium: socket.isPremium,
            role: socket.isPremium ? 'participant' : 'spectator',
            messages: result.messages,
            mode: result.mode || 'shared_story',
            agentDriveEnabled: !!result.agentDriveEnabled,
            initialNarratorPending: !!result.initialNarratorPending,
            storyArc: summarizeStoryArcForRoom(result),
          });
          
          // Notify other users in the room
          socket.to(roomId).emit('user_joined', {
            id: socket.heroId,
            name: hero.name,
            avatar: hero.images[0]?.url || null,
            isPremium: socket.isPremium,
            role: socket.isPremium ? 'participant' : 'spectator'
          });
        } catch (error) {
          console.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('agent_action_proposed', async (data) => {
        try {
          if (!socket.isAgentConnection || !socket.agentHeroId) {
            socket.emit('error', { message: 'Agent authentication required' });
            return;
          }
          const roomId = data?.roomId || socket.roomId;
          const actionText = data?.actionText;
          const mod = moderateProposalText(typeof actionText === 'string' ? actionText : '');
          if (!mod.ok) {
            socket.emit('error', { message: `Invalid proposal: ${mod.reason}` });
            return;
          }
          const room = await getSharedStoryRoom(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          if (!room.agentDriveEnabled) {
            socket.emit('error', { message: 'Agent Drive is not enabled for this room' });
            return;
          }
          const allowed = room.participants.some((p) => p.id === socket.agentHeroId);
          if (!allowed) {
            socket.emit('error', { message: 'Hero is not a participant in this room' });
            return;
          }
          const rateKey = `${socket.agentTokenId}:${roomId}`;
          const last = agentProposalRate.get(rateKey) || 0;
          if (Date.now() - last < 1500) {
            socket.emit('error', { message: 'Rate limited; wait before another proposal' });
            return;
          }
          agentProposalRate.set(rateKey, Date.now());

          const proposalId = uuidv4();
          await mutateSharedStoryRoom(roomId, (r) => {
            if (!Array.isArray(r.pendingAgentActions)) r.pendingAgentActions = [];
            r.pendingAgentActions.push({
              id: proposalId,
              heroId: socket.agentHeroId,
              tokenId: socket.agentTokenId,
              actionText: mod.text,
              status: 'pending',
              createdAt: new Date(),
            });
          });

          io.to(`user:${room.ownerUserId}`).emit('agent_action_pending', {
            roomId,
            proposal: {
              id: proposalId,
              heroId: socket.agentHeroId,
              actionText: mod.text,
              createdAt: new Date(),
            },
          });
        } catch (error) {
          console.error('agent_action_proposed:', error);
          socket.emit('error', { message: 'Failed to propose action' });
        }
      });

      socket.on('agent_action_decision', async (data) => {
        try {
          if (!socket.userId || socket.isAgentConnection) {
            socket.emit('error', { message: 'Only the human owner can decide' });
            return;
          }
          const { roomId, proposalId, decision, reason } = data || {};
          if (!roomId || !proposalId || !decision) {
            socket.emit('error', { message: 'roomId, proposalId, and decision are required' });
            return;
          }
          const room = await getSharedStoryRoom(roomId);
          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }
          if (room.ownerUserId !== socket.userId) {
            socket.emit('error', { message: 'Only the session owner can approve agent actions' });
            return;
          }
          const proposal = (room.pendingAgentActions || []).find((p) => p.id === proposalId);
          if (!proposal || proposal.status !== 'pending') {
            socket.emit('error', { message: 'Proposal not found' });
            return;
          }

          await mutateSharedStoryRoom(roomId, (r) => {
            const p = (r.pendingAgentActions || []).find((x) => x.id === proposalId);
            if (p) {
              p.status = decision === 'approve' ? 'approved' : 'rejected';
              p.decisionReason = typeof reason === 'string' ? reason.slice(0, 500) : '';
              p.decidedAt = new Date();
            }
          });

          io.to(roomId).emit('agent_action_resolved', {
            proposalId,
            decision,
            reason: reason || '',
          });

          if (decision === 'approve') {
            const hero = await heroDb.findHeroById(proposal.heroId);
            if (!hero) return;
            await appendUserMessageAndMaybeNarrator(
              io,
              roomId,
              {
                id: hero.id,
                name: hero.name,
                avatar: hero.images[0]?.url || null,
              },
              proposal.actionText,
              {
                meta: { source: 'agent_approved', proposalId },
              },
              proposal.heroId
            );
          }
        } catch (error) {
          console.error('agent_action_decision:', error);
          socket.emit('error', { message: 'Failed to process decision' });
        }
      });
      
      // Send a message in a shared story room
      socket.on('send_message', async (data) => {
        try {
          const { message } = data;

          if (socket.isAgentConnection) {
            socket.emit('error', {
              message: 'Agents must use agent_action_proposed',
            });
            return;
          }
          
          if (!socket.userId || !socket.heroId || !socket.roomId) {
            socket.emit('error', { message: 'You must join a room before sending messages' });
            return;
          }
          
          // Get the hero data
          const hero = await heroDb.findHeroById(socket.heroId);
          if (!hero) {
            socket.emit('error', { message: 'Hero not found' });
            return;
          }
          
          // Only premium users can send messages
          if (!socket.isPremium) {
            socket.emit('error', { message: 'Only premium heroes can send messages' });
            return;
          }
          
          const room = await getSharedStoryRoom(socket.roomId);
          if (!room) {
            socket.emit('error', { message: 'Shared story room not found' });
            return;
          }

          await appendUserMessageAndMaybeNarrator(
            io,
            socket.roomId,
            {
              id: hero.id,
              name: hero.name,
              avatar: hero.images[0]?.url || null,
            },
            typeof message === 'string' ? message.trim() : '',
            {},
            socket.heroId
          );
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Check if this is a quota exceeded error
          if (isOpenAIQuotaError(error)) {
            // Set the global flag
            setOpenAIQuotaExceeded(true);
            
            socket.emit('api_error', { 
              errorType: 'quota_exceeded',
              message: "OpenAI API quota exceeded. Please try again later."
            });
          } else {
            socket.emit('error', { message: 'Failed to send message' });
          }
        }
      });
      
      // Leave a shared story room
      socket.on('leave_room', async () => {
        try {
          if (!socket.userId || !socket.heroId || !socket.roomId) {
            return;
          }
          
          // Leave the room
          await leaveSharedStoryRoom(socket.roomId, socket.heroId);
          
          // Leave the socket.io room
          socket.leave(socket.roomId);
          
          // Notify other users in the room
          socket.to(socket.roomId).emit('user_left', {
            id: socket.heroId
          });
          
          // Clean up socket data
          socket.roomId = null;
        } catch (error) {
          console.error('Error leaving room:', error);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          console.log('Client disconnected:', socket.id);
          
          // If the user was in a room, leave it
          if (socket.roomId && socket.heroId) {
            await leaveSharedStoryRoom(socket.roomId, socket.heroId);
            
            // Notify other users in the room
            socket.to(socket.roomId).emit('user_left', {
              id: socket.heroId
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    // Add a quota status check endpoint
    app.get('/api/status/openai-quota', async (req, res) => {
      const isQuotaExceeded = checkOpenAIQuotaExceeded();
      
      if (isQuotaExceeded) {
        return res.status(429).json({
          status: 'exceeded',
          message: 'OpenAI API quota is currently exceeded. Generation features and payments are temporarily disabled. Please try again later.',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        status: 'available',
        message: 'OpenAI API quota is currently available.',
        timestamp: new Date().toISOString()
      });
    });

    // Start the server
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}