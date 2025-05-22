import { v4 as uuidv4 } from 'uuid';
import { generateChatCompletionWithOpenAI } from './openai.js';

// In-memory storage for shared story rooms
// In a production environment, this would be stored in a database
const sharedStoryRooms = new Map();

/**
 * Create a new shared story room
 * @param {Object} hero - The hero object of the creator
 * @returns {string} - The ID of the created room
 */
export const createSharedStoryRoom = async (hero) => {
  const roomId = uuidv4();
  
  // Create the room object
  const room = {
    id: roomId,
    title: `${hero.name}'s Cosmic Adventure`,
    creator: {
      id: hero.id,
      userId: hero.userid,
      name: hero.name,
      avatar: hero.images[0]?.url || null,
      backstory: hero.backstory,
      isPremium: hero.paymentStatus === 'paid'
    },
    participants: [{
      id: hero.id,
      userId: hero.userid,
      name: hero.name,
      avatar: hero.images[0]?.url || null,
      backstory: hero.backstory,
      isPremium: hero.paymentStatus === 'paid'
    }],
    spectators: [],
    messages: [],
    created: new Date(),
    updated: new Date()
  };
  
  // Generate initial system message
  const initialPrompt = await generateSharedStoryPrompt(room);
  const initialResponse = await generateSharedStoryResponse(initialPrompt);
  
  // Add the initial message to the room
  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: "/storage/aries2.webp"
    },
    content: initialResponse,
    timestamp: new Date()
  });
  
  // Store the room
  sharedStoryRooms.set(roomId, room);
  
  return roomId;
};

/**
 * Join a shared story room
 * @param {string} roomId - The ID of the room to join
 * @param {Object} heroData - The hero data of the joining user
 * @returns {Object} - The room object
 */
export const joinSharedStoryRoom = async (roomId, heroData) => {
  const room = sharedStoryRooms.get(roomId);
  
  if (!room) {
    throw new Error('Shared story room not found');
  }
  
  // Check if the hero is already in the room
  const existingParticipant = room.participants.find(p => p.id === heroData.id);
  const existingSpectator = room.spectators.find(s => s.id === heroData.id);
  
  if (existingParticipant || existingSpectator) {
    // User is already in the room, just return the room
    return room;
  }
  
  // Add the hero to the room as participant or spectator
  if (heroData.isPremium) {
    room.participants.push(heroData);
    
    // Generate a welcome message for the new participant
    const welcomeMessage = {
      id: uuidv4(),
      sender: {
        id: 'system',
        name: 'Cosmic Narrator',
        avatar: "/storage/aries2.webp"
      },
      content: `${heroData.name} has joined the cosmic adventure! Their backstory unfolds: ${heroData.backstory.substring(0, 200)}...`,
      timestamp: new Date()
    };
    
    room.messages.push(welcomeMessage);
  } else {
    room.spectators.push(heroData);
  }
  
  // Update the room's updated timestamp
  room.updated = new Date();
  
  return room;
};

/**
 * Leave a shared story room
 * @param {string} roomId - The ID of the room to leave
 * @param {string} heroId - The ID of the hero leaving the room
 * @returns {boolean} - Whether the leave was successful
 */
export const leaveSharedStoryRoom = async (roomId, heroId) => {
  const room = sharedStoryRooms.get(roomId);
  
  if (!room) {
    throw new Error('Shared story room not found');
  }
  
  // Remove the hero from participants or spectators
  room.participants = room.participants.filter(p => p.id !== heroId);
  room.spectators = room.spectators.filter(s => s.id !== heroId);
  
  // If there are no more participants, remove the room
  if (room.participants.length === 0) {
    sharedStoryRooms.delete(roomId);
    return true;
  }
  
  // Update the room's updated timestamp
  room.updated = new Date();
  
  // Add a message about the user leaving
  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: "/public/aries2.webp"
    },
    content: `A hero has departed from this cosmic journey.`,
    timestamp: new Date()
  });
  
  return true;
};

/**
 * Get a shared story room
 * @param {string} roomId - The ID of the room
 * @returns {Object|null} - The room object, or null if not found
 */
export const getSharedStoryRoom = async (roomId) => {
  return sharedStoryRooms.get(roomId) || null;
};

/**
 * Generate a prompt for the shared story based on room data
 * @param {Object} room - The room object
 * @returns {string} - The generated prompt
 */
export const generateSharedStoryPrompt = async (room) => {
  // Collect all participant backstories
  const backstories = room.participants
    .filter(p => p.backstory)
    .map(p => `${p.name}'s Backstory: ${p.backstory.substring(0, 500)}...`);
  
  // Create the system prompt
  const systemPrompt = `
You are the Cosmic Narrator, a masterful storyteller guiding a group of heroes through an epic shared adventure. 
Your task is to weave an engaging literary narrative that incorporates all the players and their unique backstories.

The heroes in this cosmic adventure are:
${room.participants.map(p => `- ${p.name}`).join('\n')}

Their backstories:
${backstories.join('\n\n')}

Guidelines for your narrative:
1. Write in a rich, immersive literary style reminiscent of classic fantasy authors
2. Use vivid, sensory descriptions that bring the cosmic landscape to life
3. Create epic challenges that showcase each hero's unique abilities and character
4. Incorporate elements from their backstories into the narrative
5. Format your response with literary structure:
   - Proper paragraph breaks with elegant pacing
   - Scene breaks using "***" where appropriate
   - Dynamic dialogue with proper attribution
   - Literary devices like foreshadowing, metaphor, and rhythm
6. End your responses with compelling scenarios that invite player participation
7. Maintain narrative continuity by referencing previous events and character development
8. Present a cohesive, book-like experience that feels professionally crafted

Remember: You are creating a literary experience, not simply responding to users. Your narrative should read like excerpts from a published fantasy novel.

Recent conversation context:
${room.messages.slice(-5).map(m => `${m.sender.name}: ${m.content}`).join('\n')}

Create an engaging, literary response that moves the shared story forward:
`;

  return systemPrompt;
};

/**
 * Generate a response for the shared story
 * @param {string} prompt - The prompt to use
 * @returns {string} - The generated response
 */
export const generateSharedStoryResponse = async (prompt) => {
  try {
    const response = await generateChatCompletionWithOpenAI([
      { role: 'system', content: prompt },
      { role: 'user', content: 'Please continue the cosmic narrative for our heroes.' }
    ]);
    
    return response;
  } catch (error) {
    console.error('Error generating shared story response:', error);
    return "The cosmic energies are in flux. Our story will continue shortly...";
  }
};

/**
 * List all active shared story rooms
 * @returns {Array} - Array of room objects (without messages)
 */
export const listSharedStoryRooms = async () => {
  const rooms = [];
  
  for (const [id, room] of sharedStoryRooms.entries()) {
    rooms.push({
      id: room.id,
      title: room.title,
      participantCount: room.participants.length,
      spectatorCount: room.spectators.length,
      created: room.created,
      updated: room.updated
    });
  }
  
  return rooms;
}; 