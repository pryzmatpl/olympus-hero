import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory } from './openai.js';
import { registerUser, loginUser, authMiddleware, getUserById, addHeroToUser } from './auth.js';
import { processPaymentAndCreateNFT, getNFTById, getNFTsByHeroId } from './stripe.js';
import { createSharedLink, accessSharedHero, getSharedLinksByUser, deactivateSharedLink } from './share.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9002;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
// In a production app, this would be a database
const heroes = new Map();

// Authentication Routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    const user = registerUser(email, password, name);
    return res.status(201).json({ user });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { token, user } = loginUser(email, password);
    return res.json({ token, user });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(401).json({ error: error.message });
  }
});

// Protected route to get user profile
app.get('/api/user', authMiddleware, (req, res) => {
  const user = getUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  return res.json({ user });
});

// Hero Routes (now protected by authentication)
app.post('/api/heroes', authMiddleware, async (req, res) => {
  try {
    const { birthdate, heroName } = req.body;
    const userId = req.user.userId;
    
    if (!birthdate || !heroName) {
      return res.status(400).json({ error: 'Birth date and hero name are required' });
    }
    
    // Parse the birthdate
    const dob = new Date(birthdate);
    
    // Calculate zodiac signs
    const westernZodiac = calculate_western_zodiac(dob);
    const chineseZodiac = calculate_chinese_zodiac(dob);
    
    // Generate a unique ID
    const heroId = uuidv4();
    
    // Create hero object
    const hero = {
      id: heroId,
      userId,
      name: heroName,
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
    
    // Store the hero
    heroes.set(heroId, hero);
    
    // Associate hero with user
    addHeroToUser(userId, heroId);
    
    // Return the hero ID
    return res.status(201).json({ 
      heroId,
      message: 'Hero creation initiated. Images and backstory will be generated shortly.'
    });
  } catch (error) {
    console.error('Error creating hero:', error);
    return res.status(500).json({ error: 'Failed to create hero' });
  }
});

// Get hero by ID (allowed for authenticated users who own the hero)
app.get('/api/heroes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  // Check if the user owns this hero
  if (hero.userId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to view this hero' });
  }
  
  return res.json(hero);
});

// Generate hero images and backstory
app.post('/api/heroes/:id/generate', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  // Check if the user owns this hero
  if (hero.userId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this hero' });
  }
  
  try {
    // Update status
    hero.status = 'processing';
    heroes.set(id, hero);
    
    // Generate images
    const viewAngles = ['front', 'profile', 'action'];
    const imagePromises = viewAngles.map(angle => 
      generateOpenAIImages(hero.name, hero.westernZodiac, hero.chineseZodiac, angle)
    );
    
    // Wait for all images to be generated
    const images = await Promise.all(imagePromises);
    hero.images = images;
    
    // Generate backstory
    const backstory = await generateBackstory(hero.name, hero.westernZodiac, hero.chineseZodiac);
    hero.backstory = backstory;
    
    // Update status
    hero.status = 'completed';
    heroes.set(id, hero);
    
    return res.json({ 
      message: 'Hero generation completed',
      hero
    });
  } catch (error) {
    console.error('Error generating hero content:', error);
    hero.status = 'error';
    heroes.set(id, hero);
    return res.status(500).json({ error: 'Failed to generate hero content' });
  }
});

// Process payment with Stripe and create NFT
app.post('/api/heroes/:id/payment', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { paymentDetails } = req.body;
  const userId = req.user.userId;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  // Check if the user owns this hero
  if (hero.userId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this hero' });
  }
  
  try {
    // Process payment and create NFT
    const nft = processPaymentAndCreateNFT(id, paymentDetails);
    
    // Update hero with NFT ID and payment status
    hero.nftId = nft.id;
    hero.paymentStatus = 'paid';
    heroes.set(id, hero);
    
    return res.json({ 
      message: 'Payment processed successfully and NFT created',
      hero,
      nft
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get NFT details for a hero
app.get('/api/heroes/:id/nft', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  // Check if the user owns this hero
  if (hero.userId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to view this hero' });
  }
  
  if (!hero.nftId) {
    return res.status(404).json({ error: 'No NFT found for this hero' });
  }
  
  const nft = getNFTById(hero.nftId);
  if (!nft) {
    return res.status(404).json({ error: 'NFT not found' });
  }
  
  return res.json({ nft });
});

// Sharing Routes
// Create a shared link for a hero
app.post('/api/heroes/:id/share', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const { expiresAt, maxAccesses } = req.body;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  // Check if the user owns this hero
  if (hero.userId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to share this hero' });
  }
  
  // Create the shared link
  const sharedLink = createSharedLink(id, userId, { expiresAt, maxAccesses });
  
  return res.status(201).json({ 
    message: 'Shared link created successfully',
    sharedLink
  });
});

// Get all shared links for a user
app.get('/api/user/shares', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  
  const sharedLinks = getSharedLinksByUser(userId);
  
  return res.json({ sharedLinks });
});

// Deactivate a shared link
app.delete('/api/shares/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  const success = deactivateSharedLink(id, userId);
  
  if (!success) {
    return res.status(404).json({ error: 'Shared link not found or you do not have permission to deactivate it' });
  }
  
  return res.json({ message: 'Shared link deactivated successfully' });
});

// Public access to shared hero
app.get('/api/share/:shareId', (req, res) => {
  const { shareId } = req.params;
  
  const result = accessSharedHero(shareId);
  
  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }
  
  // Get the hero data
  const hero = heroes.get(result.heroId);
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});