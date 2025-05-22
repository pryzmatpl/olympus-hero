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
  
  // Format the hero's backstory for display
  const formattedBackstory = hero.backstory ? 
    formatBackstoryForDisplay(hero.backstory.substring(0, 300) + '...') : '';
  
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
  
  // Add initial welcome message
  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: "/storage/aries2.webp"
    },
    content: `<div class="system-message welcome-message">
      <h3 class="welcome-heading">A New Cosmic Adventure Begins</h3>
      <p class="welcome-text">Welcome, ${hero.name}, to your cosmic adventure!</p>
      <p class="welcome-text">Your story unfolds from your origins:</p>
      ${formattedBackstory}
    </div>`,
    timestamp: new Date()
  });
  
  // Generate initial story message
  const initialPrompt = await generateSharedStoryPrompt(room);
  const initialResponse = await generateSharedStoryResponse(initialPrompt);
  
  // Add the initial story message to the room
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
    
    // Format the backstory for display
    const formattedBackstory = heroData.backstory ? 
      formatBackstoryForDisplay(heroData.backstory.substring(0, 200) + '...') : '';
    
    // Generate a welcome message for the new participant
    const welcomeMessage = {
      id: uuidv4(),
      sender: {
        id: 'system',
        name: 'Cosmic Narrator',
        avatar: "/storage/aries2.webp"
      },
      content: `<p>${heroData.name} has joined the cosmic adventure!</p><p>Their backstory unfolds:</p><div class="hero-backstory">${formattedBackstory}</div>`,
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
  
  // Find the hero that is leaving
  const leavingHero = [...room.participants, ...room.spectators].find(p => p.id === heroId);
  const heroName = leavingHero ? leavingHero.name : 'A hero';
  
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
      avatar: "/storage/aries2.webp"
    },
    content: `<p>${heroName} has departed from this cosmic journey.</p><p>The remaining heroes continue their quest...</p>`,
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
5. Format your response with a professional typographic structure:
   - Use clear paragraph breaks (double line breaks) for a clean, book-like appearance
   - Create proper indentation for new paragraphs or dialogue (use a single tab or 2-4 spaces)
   - Use scene breaks with "***" on their own line to separate distinct scenes
   - Format dialogue with proper quotation marks and attribution (e.g., "This is what I said," replied Hero)
   - Use italics by surrounding text with *asterisks* for emphasis, internal thoughts, or special terms
   - Use bold by surrounding text with **double asterisks** for powerful moments or important revelations
   - For chapter titles or section headings, place them on their own lines with a blank line before and after
   - Use proper em-dashes (--) for interruptions in dialogue or thoughts
   - Consider using a drop cap (larger first letter) for the beginning of new chapters
6. For chapter headings:
   - Number chapters clearly: "Chapter X: Title" or simply "Chapter X"
   - Keep chapter titles concise, evocative, and relevant to the content
   - Place each chapter heading on its own line with blank lines before and after
7. End your responses with compelling scenarios that invite player participation
8. Maintain narrative continuity by referencing previous events and character development
9. Present a cohesive, book-like experience that feels professionally crafted with clear typographic hierarchy

Remember: You are creating a literary experience, not simply responding to users. Your narrative should read like excerpts from a published fantasy novel with professional typography and layout.

Recent conversation context:
${room.messages.slice(-5).map(m => `${m.sender.name}: ${m.content.replace(/<[^>]*>/g, '')}`).join('\n')}

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
    
    // Process the response to enhance formatting for web display
    return formatStoryContentForDisplay(response);
  } catch (error) {
    console.error('Error generating shared story response:', error);
    return "<p>The cosmic energies are in flux. Our story will continue shortly...</p>";
  }
};

/**
 * Format story content for proper web display
 * @param {string} content - The raw story content
 * @returns {string} - Formatted HTML content
 */
const formatStoryContentForDisplay = (content) => {
  if (!content) return '';
  
  // Process the text for web display
  let formatted = content
    // Convert line breaks to HTML
    .replace(/\n\n/g, '</p><p class="story-paragraph">')
    .replace(/\n/g, '<br>')
    
    // Format scene breaks
    .replace(/\*\*\*/g, '<hr class="scene-break">')
    
    // Format italics
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Format bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Format chapter/section headings (lines that are short and surrounded by blank lines)
    .replace(/(<p class="story-paragraph">)(.{1,60})(<\/p>)/g, (match, p1, text, p2) => {
      // Only convert if it looks like a heading (short text, no punctuation at end)
      if (text.length < 60 && !text.match(/[.,:;!?]$/)) {
        return `<h3 class="chapter-heading">${text}</h3>`;
      }
      return match;
    })
    
    // Format em-dashes for better typography
    .replace(/--/g, '&mdash;')
    
    // Format dialogue for better readability
    .replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>')
    
    // Add first-line indentation class to paragraphs that aren't headings or don't start with dialogue
    .replace(/<p class="story-paragraph">(?!<span class="dialogue">)/g, '<p class="story-paragraph indented">');
  
  // Wrap in paragraph tags if not already wrapped
  if (!formatted.startsWith('<p')) {
    formatted = '<p class="story-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }
  
  // Wrap the entire content in a container for styling
  formatted = `<div class="story-content">${formatted}</div>`;
  
  return formatted;
};

/**
 * Format backstory text for proper display
 * @param {string} backstory - The raw backstory text
 * @returns {string} - Formatted HTML content
 */
const formatBackstoryForDisplay = (backstory) => {
  if (!backstory) return '';
  
  // Process the backstory for web display
  let formatted = backstory
    // Convert line breaks to HTML
    .replace(/\n\n/g, '</p><p class="backstory-paragraph">')
    .replace(/\n/g, '<br>')
    
    // Format italics (text between asterisks)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Format bold text (text between double asterisks)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Format em-dashes for better typography
    .replace(/--/g, '&mdash;')
    
    // Format dialogue
    .replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!formatted.startsWith('<p')) {
    formatted = '<p class="backstory-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }
  
  // Wrap the entire content in a container for styling
  formatted = `<div class="backstory-content">${formatted}</div>`;
  
  return formatted;
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

/**
 * Format user message content for display
 * @param {string} content - The raw user message content
 * @returns {string} - Formatted HTML content
 */
export const formatUserMessageForDisplay = (content) => {
  if (!content) return '';
  
  // Process the user message for web display
  let formatted = content
    // Convert line breaks to HTML
    .replace(/\n\n/g, '</p><p class="user-paragraph">')
    .replace(/\n/g, '<br>')
    
    // Format italics
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // Format bold text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Format em-dashes for better typography
    .replace(/--/g, '&mdash;')
    
    // Format dialogue for better readability
    .replace(/"([^"]+)"/g, '<span class="dialogue">"$1"</span>');
  
  // Wrap in paragraph tags if not already wrapped
  if (!formatted.startsWith('<p')) {
    formatted = '<p class="user-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }
  
  // Wrap the entire content in a container for styling
  formatted = `<div class="user-content">${formatted}</div>`;
  
  return formatted;
};

/**
 * Add a user message to a shared story room
 * @param {string} roomId - The ID of the room
 * @param {Object} heroData - The hero data of the user
 * @param {string} content - The message content
 * @returns {Object} - The updated room object
 */
export const addUserMessageToRoom = async (roomId, heroData, content) => {
  const room = sharedStoryRooms.get(roomId);
  
  if (!room) {
    throw new Error('Shared story room not found');
  }
  
  // Check if the hero is a participant in the room
  const isParticipant = room.participants.some(p => p.id === heroData.id);
  
  if (!isParticipant) {
    throw new Error('Only participants can send messages');
  }
  
  // Format the user message content
  const formattedContent = formatUserMessageForDisplay(content);
  
  // Add the user message
  const userMessage = {
    id: uuidv4(),
    sender: {
      id: heroData.id,
      name: heroData.name,
      avatar: heroData.avatar || null
    },
    content: formattedContent,
    timestamp: new Date()
  };
  
  room.messages.push(userMessage);
  
  // Generate narrator response
  const narratorPrompt = await generateSharedStoryPrompt(room);
  const narratorResponse = await generateSharedStoryResponse(narratorPrompt);
  
  // Add the narrator response
  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: "/storage/aries2.webp"
    },
    content: narratorResponse,
    timestamp: new Date()
  });
  
  // Update the room's updated timestamp
  room.updated = new Date();
  
  return room;
}; 