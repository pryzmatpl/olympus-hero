import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory } from './openai.js';
import { registerUser, loginUser, authMiddleware, getUserById, addHeroToUser } from './auth.js';
import { processPaymentAndCreateNFT, getNFTById, getNFTsByHeroId } from './stripe.js';
import { createSharedLink, accessSharedHero, getSharedLinksByUser, deactivateSharedLink } from './share.js';
import { initializeDB, heroDb } from './db.js';

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

// Initialize the database connection
initializeDB().catch(console.error);

const app = express();
const PORT = process.env.PORT || 9002;

// Middleware
app.use(cors());
app.use(express.json());

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

  try {
    // Update status
    hero.status = 'processing';
    await heroDb.updateHero(id, { status: 'processing' });

    // Generate images
    const viewAngles = ['front', 'profile', 'action'];
    const imagePromises = viewAngles.map(angle =>
        generateOpenAIImages(hero.name, hero.westernZodiac, hero.chineseZodiac, angle)
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

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});