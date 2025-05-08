import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory, isOpenAIQuotaError, checkOpenAIQuotaExceeded, setOpenAIQuotaExceeded } from './openai.js';
import { registerUser, loginUser, authMiddleware, getUserById, addHeroToUser } from './auth.js';
import { processPaymentAndCreateNFT, getNFTById, getNFTsByHeroId } from './stripe.js';
import { createSharedLink, accessSharedHero, getSharedLinksByUser, deactivateSharedLink } from './share.js';
import { initializeDB, heroDb, storyBookDb } from './db.js';
import { ensureStorageDirectories, createHeroZip } from './utils.js';
import { 
  createSharedStoryRoom, 
  joinSharedStoryRoom, 
  leaveSharedStoryRoom, 
  getSharedStoryRoom,
  generateSharedStoryPrompt,
  generateSharedStoryResponse,
  listSharedStoryRooms
} from './sharedStory.js';
import {
  createStoryBook,
  getOrCreateStoryBook,
  getStoryBookChapters,
  unlockChapters,
  checkAndUnlockDailyChapters
} from './storybook.js';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import stripe from 'stripe';

// Load environment variables
dotenv.config();

// Verify critical environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Make sure these variables are set in your .env file or environment.');
  process.exit(1);
}

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

// Initialize the database connection
initializeDB().catch(console.error);

// Initialize storage directories
console.log('Initializing storage directories...');
ensureStorageDirectories().then(() => {
  console.log('Storage directories initialized successfully');
}).catch(err => {
  console.error('Failed to create storage directories:', err);
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:9001', 'http://127.0.0.1:9001', 'http://mythicalhero.me', 'https://mythicalhero.me'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 9002;

// Enable CORS debugging
console.log('Setting up CORS middleware...');

// CORS middleware 
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  // For preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.header('Access-Control-Allow-Origin', 'http://localhost:9001');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).send();
  }
  next();
});

// Main CORS middleware
app.use(cors({
  origin: ['http://localhost:9001', 'http://127.0.0.1:9001', 'https://mythicalhero.me', 'http://mythicalhero.me'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add explicit handling for OPTIONS requests
app.options('*', cors());

app.use(express.json());

// Serve static files from the storage directory
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));
console.log('Static file serving enabled from:', path.join(process.cwd(), 'storage'));

// Debugging endpoint to check if server is alive
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
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
    } catch (error) {
      console.error('Error processing payment webhook:', error);
    }
  }

  res.json({ received: true });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    const user = await registerUser(email, password, name);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(400).json({ error: error.message });
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
    const reqBody = req.body;
    const user = req.user;
    const data = JSON.parse(reqBody.body);
    
    if (!data.birthdate || !data.heroName) {
      return res.status(400).json({ error: 'Birth date and hero name are required' });
    }
    
    // Parse the birthdate
    const dob = new Date(data.birthdate);

    // Calculate zodiac signs
    const westernZodiac = calculate_western_zodiac(dob);
    const chineseZodiac = calculate_chinese_zodiac(dob);
    
    // Create hero object
    const hero = {
      id: data.heroId,
      userid: user.userId,
      name: data.heroName,
      birthdate: dob,
      westernZodiac,
      chineseZodiac,
      created: new Date(),
      status: 'pending', // pending, processing, completed
      images: [],
      backstory: '',
      paymentStatus: 'unpaid',
      nftId: null
    };
    
    // Store the hero in database
    await heroDb.createHero(hero);
    
    // Associate hero with user
    await addHeroToUser(user.userId, data.heroId);
    
    // Return the hero ID
    return res.status(201).json({ 
      hero,
      message: 'Hero creation initiated. Images and backstory will be generated shortly.'
    });
  } catch (error) {
    console.error('Error creating hero:', error);
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
  
  return res.json(hero);
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

    // Get the updated hero
    const updatedHero = await heroDb.findHeroById(id);

    return res.json({
      message: 'Hero generation completed',
      hero: updatedHero,
    });
  } catch (error) {
    console.error('Error generating hero content:', error);
    
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
  if (hero.userId !== userId) {
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
  if (hero.userId !== userId) {
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
    const { heroId } = req.body;
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
    
    // Create a new shared story room
    const roomId = await createSharedStoryRoom(hero);
    
    return res.status(201).json({ 
      roomId,
      message: 'Shared story room created successfully' 
    });
  } catch (error) {
    console.error('Error creating shared story room:', error);
    return res.status(500).json({ error: 'Failed to create shared story room' });
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
    
    // Return basic room info (not including messages)
    return res.json({
      roomId: room.id,
      title: room.title,
      participants: room.participants.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isPremium: p.isPremium
      })),
      created: room.created
    });
  } catch (error) {
    console.error('Error getting shared story room:', error);
    return res.status(500).json({ error: 'Failed to get shared story room details' });
  }
});

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
    const storyBook = await getOrCreateStoryBook(heroId, isPremium);
    
    // Check for daily chapter unlocks
    if (isPremium) {
      await checkAndUnlockDailyChapters(storyBook.id);
    }
    
    // Get the chapters
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
      
      // Notify client of successful authentication
      socket.emit('authenticated', { userId, heroId });
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authentication_error', { message: 'Authentication failed' });
    }
  });
  
  // Join a shared story room
  socket.on('join_room', async (data) => {
    try {
      const { roomId } = data;
      
      if (!socket.userId || !socket.heroId) {
        socket.emit('error', { message: 'You must authenticate before joining a room' });
        return;
      }
      
      // Get the hero data
      const hero = await heroDb.findHeroById(socket.heroId);
      if (!hero) {
        socket.emit('error', { message: 'Hero not found' });
        return;
      }
      
      // Join the room (as participant if premium, spectator if not)
      const result = await joinSharedStoryRoom(roomId, {
        id: socket.heroId,
        userId: socket.userId,
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
        messages: result.messages
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
  
  // Send a message in a shared story room
  socket.on('send_message', async (data) => {
    try {
      const { message } = data;
      
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
      
      // Get the shared story room
      const room = await getSharedStoryRoom(socket.roomId);
      if (!room) {
        socket.emit('error', { message: 'Shared story room not found' });
        return;
      }
      
      // Add the message to the room
      const newMessage = {
        id: uuidv4(),
        sender: {
          id: socket.heroId,
          name: hero.name,
          avatar: hero.images[0]?.url || null
        },
        content: message,
        timestamp: new Date()
      };
      
      room.messages.push(newMessage);
      
      // Broadcast the message to all users in the room
      io.to(socket.roomId).emit('message', newMessage);
      
      // Generate AI response if needed
      if (room.messages.filter(m => m.sender.id !== 'system').length % 3 === 0) {
        // Check if OpenAI quota is exceeded before proceeding
        if (checkOpenAIQuotaExceeded()) {
          console.log('Skipping AI response generation due to OpenAI quota exceeded');
          
          // Directly send an error message
          const errorMessage = {
            id: uuidv4(),
            sender: {
              id: 'system',
              name: 'System',
              avatar: null
            },
            content: "The Cosmic Narrator is taking a brief rest. Our cosmic energies (API quota) have been temporarily depleted. Please try again later.",
            timestamp: new Date(),
            isError: true
          };
          
          room.messages.push(errorMessage);
          io.to(socket.roomId).emit('message', errorMessage);
          
          // Also emit the specialized API error event
          socket.emit('api_error', { 
            errorType: 'quota_exceeded',
            message: "OpenAI API quota exceeded. The Cosmic Narrator is unavailable at the moment. Please try again later."
          });
          
          return;
        }
        
        // Notify clients that the narrator is generating a response
        io.to(socket.roomId).emit('narrator_typing');
        
        // Create the prompt based on room messages and participants
        const prompt = await generateSharedStoryPrompt(room);
        
        // Start timing the response generation
        const startTime = Date.now();
        
        try {
          // Get AI response
          const responseContent = await generateSharedStoryResponse(prompt);
          
          // Calculate how long the AI response took
          const responseTime = Date.now() - startTime;
          
          // Ensure the narrator typing animation is shown for at least 3.5 seconds
          // for a more dramatic effect
          const MIN_TYPING_TIME = 3500; // milliseconds
          
          if (responseTime < MIN_TYPING_TIME) {
            await new Promise(resolve => setTimeout(resolve, MIN_TYPING_TIME - responseTime));
          }
          
          // Add the AI response to the room
          const aiMessage = {
            id: uuidv4(),
            sender: {
              id: 'system',
              name: 'Cosmic Narrator',
              avatar: null
            },
            content: responseContent,
            timestamp: new Date()
          };
          
          room.messages.push(aiMessage);
          
          // Broadcast the AI message to all users in the room
          io.to(socket.roomId).emit('message', aiMessage);
        } catch (aiError) {
          console.error('Error generating AI response:', aiError);
          
          // Check if this is a quota exceeded error
          if (isOpenAIQuotaError(aiError)) {
            // Set the global flag
            setOpenAIQuotaExceeded(true);
            
            // Send a specialized error to the client
            socket.emit('api_error', { 
              errorType: 'quota_exceeded',
              message: "OpenAI API quota exceeded. The Cosmic Narrator is unavailable at the moment. Please try again later."
            });
            
            // Also send a system message to all users in the room
            const errorMessage = {
              id: uuidv4(),
              sender: {
                id: 'system',
                name: 'System',
                avatar: null
              },
              content: "The Cosmic Narrator is taking a brief rest. Our cosmic energies (API quota) have been temporarily depleted. Please try again later.",
              timestamp: new Date(),
              isError: true
            };
            
            room.messages.push(errorMessage);
            io.to(socket.roomId).emit('message', errorMessage);
          } else {
            // Handle other errors
            socket.emit('error', { message: 'Failed to generate AI response' });
          }
        }
      }
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