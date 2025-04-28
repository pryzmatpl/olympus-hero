import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory } from './openai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
// In a production app, this would be a database
const heroes = new Map();

// Routes
app.post('/api/heroes', async (req, res) => {
  try {
    const { birthdate, heroName } = req.body;
    
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
      name: heroName,
      birthdate: dob,
      westernZodiac,
      chineseZodiac,
      created: new Date(),
      status: 'pending', // pending, processing, completed
      images: [],
      backstory: '',
      paymentStatus: 'unpaid'
    };
    
    // Store the hero
    heroes.set(heroId, hero);
    
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

// Get hero by ID
app.get('/api/heroes/:id', (req, res) => {
  const { id } = req.params;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  return res.json(hero);
});

// Generate hero images and backstory
app.post('/api/heroes/:id/generate', async (req, res) => {
  const { id } = req.params;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  const hero = heroes.get(id);
  
  try {
    // Update status
    hero.status = 'processing';
    heroes.set(id, hero);
    
    // Generate images (in a real app, this would call the OpenAI API)
    // This is a mock implementation
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

// Process payment
app.post('/api/heroes/:id/payment', (req, res) => {
  const { id } = req.params;
  const { paymentDetails } = req.body;
  
  if (!heroes.has(id)) {
    return res.status(404).json({ error: 'Hero not found' });
  }
  
  // In a real app, this would process the payment with Stripe
  // For demo purposes, we'll just update the payment status
  const hero = heroes.get(id);
  hero.paymentStatus = 'paid';
  heroes.set(id, hero);
  
  return res.json({ 
    message: 'Payment processed successfully',
    hero
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});