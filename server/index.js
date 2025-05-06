import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { calculate_western_zodiac, calculate_chinese_zodiac } from './zodiac.js';
import { generateOpenAIImages, generateBackstory } from './openai.js';
import { registerUser, loginUser, authMiddleware, getUserById, addHeroToUser } from './auth.js';
import { processPaymentAndCreateNFT, getNFTById, getNFTsByHeroId } from './stripe.js';
import { createSharedLink, accessSharedHero, getSharedLinksByUser, deactivateSharedLink } from './share.js';
import { initializeDB, heroDb } from './db.js';
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
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

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
    origin: ['http://localhost:9001', 'http://127.0.0.1:9001'],
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
  origin: ['http://localhost:9001', 'http://127.0.0.1:9001'],
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

// Socket.IO Connection Handling
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
        // Create the prompt based on room messages and participants
        const prompt = await generateSharedStoryPrompt(room);
        
        // Get AI response
        const responseContent = await generateSharedStoryResponse(prompt);
        
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
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

// Start the server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});