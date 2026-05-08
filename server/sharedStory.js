import { v4 as uuidv4 } from 'uuid';
import { generateChatCompletionWithOpenAI } from './openai.js';
import { sharedStoryRoomDb, heroDb } from './db.js';
import { formatLoreForPrompt } from './heroLore.js';
import { getStoryArcTemplate, getBeatAtStep, listStoryArcSummaries } from './storyArcs.js';
import { applyProgressEvent } from './progression.js';

/** @typedef {'shared_story'|'skirmish'|'scripted_story'} SharedStoryMode */

/** @deprecated Prefer story arc templates; kept for older clients/tests. */
export const SCRIPTED_STORY_BEATS = ['intro', 'conflict', 'twist', 'climax', 'resolution'];

export { listStoryArcSummaries };

/**
 * Resolved beat + template for narrator prompts (shared + scripted modes).
 * @param {object} room
 */
export function resolveNarrativeBeatContext(room) {
  if (room.mode === 'scripted_story' && room.scriptedState?.templateId) {
    const template = getStoryArcTemplate(room.scriptedState.templateId);
    const step = Math.max(0, room.scriptedState.stepIndex ?? 0);
    const beat = getBeatAtStep(template, step);
    if (!beat) return null;
    return { template, step, beat };
  }
  if (room.mode === 'shared_story' && room.storyArcState?.templateId) {
    const template = getStoryArcTemplate(room.storyArcState.templateId);
    const step = Math.max(0, room.storyArcState.stepIndex ?? 0);
    const beat = getBeatAtStep(template, step);
    if (!beat) return null;
    return { template, step, beat };
  }
  return null;
}

/** Advance arc step after a Cosmic Narrator beat (shared_story only). */
export function advanceSharedStoryArcStep(room) {
  if (room.mode !== 'shared_story' || !room.storyArcState?.templateId) return;
  const template = getStoryArcTemplate(room.storyArcState.templateId);
  const maxIdx = template.beats.length - 1;
  const cur = room.storyArcState.stepIndex ?? 0;
  room.storyArcState = {
    ...room.storyArcState,
    stepIndex: Math.min(maxIdx, cur + 1),
  };
}

/**
 * @param {object} room
 */
export function summarizeStoryArcForRoom(room) {
  const ctx = resolveNarrativeBeatContext(room);
  if (!ctx) return null;
  return {
    templateId: ctx.template.id,
    arcName: ctx.template.name,
    tagline: ctx.template.tagline,
    stepIndex: ctx.step,
    totalSteps: ctx.template.beats.length,
    currentBeatTitle: ctx.beat.title,
    currentBeatKey: ctx.beat.key,
  };
}

/**
 * Normalize Mongo-loaded room (dates, defaults).
 * @param {object|null} doc
 */
export function normalizeSharedStoryRoom(doc) {
  if (!doc) return null;
  const room = { ...doc };
  room.created = room.created ? new Date(room.created) : new Date();
  room.updated = room.updated ? new Date(room.updated) : new Date();
  if (!room.mode) room.mode = 'shared_story';
  if (!Array.isArray(room.participants)) room.participants = [];
  if (!Array.isArray(room.spectators)) room.spectators = [];
  if (!Array.isArray(room.messages)) room.messages = [];
  if (room.pendingAgentActions === undefined) room.pendingAgentActions = [];
  if (room.agentDriveEnabled === undefined) room.agentDriveEnabled = false;
  if (room.initialNarratorPending === undefined) room.initialNarratorPending = false;
  if (room.storyArcState === undefined) room.storyArcState = null;
  room.messages = room.messages.map((m) => ({
    ...m,
    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
  }));
  room.pendingAgentActions = (room.pendingAgentActions || []).map((p) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  }));
  return room;
}

async function loadRoom(roomId) {
  const raw = await sharedStoryRoomDb.findById(roomId);
  return normalizeSharedStoryRoom(raw);
}

async function persistRoom(room) {
  await sharedStoryRoomDb.saveRoom(room);
  return room;
}

/**
 * Create a new shared story room
 * @param {Object} hero - The hero object of the creator
 * @param {{ mode?: SharedStoryMode, scriptTemplateId?: string, storyArcId?: string }} [options]
 * @returns {Promise<string>} - The ID of the created room
 */
export const createSharedStoryRoom = async (hero, options = {}) => {
  const roomId = uuidv4();
  const mode =
    options.mode === 'skirmish' || options.mode === 'scripted_story'
      ? options.mode
      : 'shared_story';

  const arcIdFromOptions = options.storyArcId || options.scriptTemplateId;
  const scriptedTemplate =
    mode === 'scripted_story' ? getStoryArcTemplate(arcIdFromOptions) : null;
  const sharedArcTemplate =
    mode === 'shared_story' && typeof options.storyArcId === 'string' && options.storyArcId.trim()
      ? getStoryArcTemplate(options.storyArcId)
      : null;

  const formattedBackstory = hero.backstory
    ? formatBackstoryForDisplay(hero.backstory.substring(0, 300) + '...')
    : '';

  const scriptedState =
    mode === 'scripted_story' && scriptedTemplate
      ? {
          templateId: scriptedTemplate.id,
          stepIndex: 0,
          beats: scriptedTemplate.beats.map((b) => b.key),
        }
      : null;

  const storyArcState =
    mode === 'shared_story' && sharedArcTemplate
      ? {
          templateId: sharedArcTemplate.id,
          stepIndex: 0,
          beatKeys: sharedArcTemplate.beats.map((b) => b.key),
        }
      : null;

  const skirmishState =
    mode === 'skirmish'
      ? {
          round: 1,
          turnIndex: 0,
          status: 'active',
          participantsOrder: [hero.id],
        }
      : null;

  const avatarUrl = hero.images?.[0]?.url ?? null;

  const room = {
    id: roomId,
    title: `${hero.name}'s Cosmic Adventure`,
    creator: {
      id: hero.id,
      userId: hero.userid,
      name: hero.name,
      avatar: avatarUrl,
      backstory: hero.backstory,
      isPremium: hero.paymentStatus === 'paid',
    },
    participants: [
      {
        id: hero.id,
        userId: hero.userid,
        name: hero.name,
        avatar: avatarUrl,
        backstory: hero.backstory,
        isPremium: hero.paymentStatus === 'paid',
      },
    ],
    spectators: [],
    messages: [],
    created: new Date(),
    updated: new Date(),
    mode,
    ownerUserId: hero.userid,
    agentDriveEnabled: false,
    initialNarratorPending: true,
    pendingAgentActions: [],
    scriptedState,
    storyArcState,
    skirmishState,
  };

  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: '/storage/aries2.webp',
    },
    content: `<div class="system-message welcome-message">
      <h3 class="welcome-heading">A New Cosmic Adventure Begins</h3>
      <p class="welcome-text">Welcome, ${hero.name}, to your cosmic adventure!</p>
      <p class="welcome-text">Your story unfolds from your origins:</p>
      ${formattedBackstory}
    </div>`,
    timestamp: new Date(),
  });

  // Opening narrator prose runs after HTTP 201 (see appendInitialRoomNarrator) so reverse-proxy
  // timeouts (e.g. nginx default ~60s) cannot kill POST /api/shared-story/create while OpenAI runs.

  await sharedStoryRoomDb.insertRoom(room);

  try {
    await applyProgressEvent(hero.id, 'shared_story_session_open', {
      source: 'shared_story_room_create',
      roomId,
    });
  } catch (e) {
    console.error('shared_story_session_open progression:', e?.message || e);
  }

  return roomId;
};

/**
 * Join a shared story room
 * @param {string} roomId
 * @param {Object} heroData
 * @returns {Promise<Object>}
 */
export const joinSharedStoryRoom = async (roomId, heroData) => {
  const room = await loadRoom(roomId);

  if (!room) {
    throw new Error('Shared story room not found');
  }

  const existingParticipant = room.participants.find((p) => p.id === heroData.id);
  const existingSpectator = room.spectators.find((s) => s.id === heroData.id);

  if (existingParticipant || existingSpectator) {
    return room;
  }

  if (heroData.isPremium) {
    room.participants.push(heroData);

    const formattedBackstory = heroData.backstory
      ? formatBackstoryForDisplay(heroData.backstory.substring(0, 200) + '...')
      : '';

    const welcomeMessage = {
      id: uuidv4(),
      sender: {
        id: 'system',
        name: 'Cosmic Narrator',
        avatar: '/storage/aries2.webp',
      },
      content: `<p>${heroData.name} has joined the cosmic adventure!</p><p>Their backstory unfolds:</p><div class="hero-backstory">${formattedBackstory}</div>`,
      timestamp: new Date(),
    };

    room.messages.push(welcomeMessage);
    if (room.skirmishState && Array.isArray(room.skirmishState.participantsOrder)) {
      room.skirmishState.participantsOrder.push(heroData.id);
    }
  } else {
    room.spectators.push(heroData);
  }

  room.updated = new Date();
  await persistRoom(room);
  return room;
};

/**
 * Leave a shared story room
 * @param {string} roomId
 * @param {string} heroId
 * @returns {Promise<boolean>}
 */
export const leaveSharedStoryRoom = async (roomId, heroId) => {
  const room = await loadRoom(roomId);

  if (!room) {
    throw new Error('Shared story room not found');
  }

  const leavingHero = [...room.participants, ...room.spectators].find((p) => p.id === heroId);
  const heroName = leavingHero ? leavingHero.name : 'A hero';

  room.participants = room.participants.filter((p) => p.id !== heroId);
  room.spectators = room.spectators.filter((s) => s.id !== heroId);

  if (room.participants.length === 0) {
    await sharedStoryRoomDb.deleteRoom(roomId);
    return true;
  }

  room.updated = new Date();
  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: '/storage/aries2.webp',
    },
    content: `<p>${heroName} has departed from this cosmic journey.</p><p>The remaining heroes continue their quest...</p>`,
    timestamp: new Date(),
  });

  if (room.skirmishState?.participantsOrder) {
    room.skirmishState.participantsOrder = room.skirmishState.participantsOrder.filter(
      (id) => id !== heroId
    );
  }

  await persistRoom(room);
  return true;
};

/**
 * @param {string} roomId
 * @returns {Promise<Object|null>}
 */
export const getSharedStoryRoom = async (roomId) => {
  return loadRoom(roomId);
};

/**
 * @param {Object} room
 * @returns {Promise<string>}
 */
export const generateSharedStoryPrompt = async (room) => {
  const backstories = room.participants
    .filter((p) => p.backstory)
    .map((p) => `${p.name}'s Backstory: ${p.backstory.substring(0, 500)}...`);

  /** Fresh from DB so new journal lines appear on later narrator beats. */
  const loreByHero = [];
  for (const p of room.participants) {
    try {
      const freshHero = await heroDb.findHeroById(p.id);
      const block = formatLoreForPrompt(freshHero);
      if (block) loreByHero.push(`${p.name}:${block}`);
    } catch (e) {
      console.error('generateSharedStoryPrompt lore hydrate:', p?.id, e?.message || e);
    }
  }
  const loreSection =
    loreByHero.length > 0
      ? `\nContributed lore journals (player-written lines; weave as character truth, never as a recited checklist):\n${loreByHero.join('\n')}\n`
      : '';

  const beatCtx = resolveNarrativeBeatContext(room);
  const arcBlock = beatCtx
    ? `
STRUCTURED STORY ARC — this spine is mandatory; do not skip or merge beats:
- Arc title: "${beatCtx.template.name}"
- Arc logline: ${beatCtx.template.tagline}
- Current beat (${beatCtx.step + 1} of ${beatCtx.template.beats.length}): **${beatCtx.beat.title}** [${beatCtx.beat.key}]
- What you must deliver in this response: ${beatCtx.beat.directive}
- Plant subtle hooks toward the next beat without resolving it; keep player agency high.
`
    : '';

  const systemPrompt = `
You are the Cosmic Narrator, a masterful storyteller guiding a group of heroes through an epic shared adventure. 
Your task is to weave an engaging literary narrative that incorporates all the players and their unique backstories.

The heroes in this cosmic adventure are:
${room.participants.map((p) => `- ${p.name}`).join('\n')}

Their backstories:
${backstories.join('\n\n')}
${loreSection}${arcBlock}
Guidelines for your narrative:
1. Write in a rich, immersive literary style reminiscent of classic fantasy authors
2. Use vivid, sensory descriptions that bring the cosmic landscape to life
3. Create epic challenges that showcase each hero's unique abilities and character
4. Incorporate elements from their backstories and contributed lore journals into the narrative
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
${room.messages
  .slice(-5)
  .map((m) => `${m.sender.name}: ${m.content.replace(/<[^>]*>/g, '')}`)
  .join('\n')}

Create an engaging, literary response that moves the shared story forward:
`;

  return systemPrompt;
};

/**
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export const generateSharedStoryResponse = async (prompt) => {
  try {
    const response = await generateChatCompletionWithOpenAI([
      { role: 'system', content: prompt },
      { role: 'user', content: 'Please continue the cosmic narrative for our heroes.' },
    ]);

    return formatStoryContentForDisplay(response);
  } catch (error) {
    console.error('Error generating shared story response:', error);
    return '<p>The cosmic energies are in flux. Our story will continue shortly...</p>';
  }
};

const formatStoryContentForDisplay = (content) => {
  if (!content) return '';

  const dialoguePattern = /(^|[\s([{\u2014-])"([^"\n]+)"(?=[\s)\]}\u2014.,!?;:]|$)/g;

  let formatted = content
    .replace(dialoguePattern, '$1<span class="dialogue">"$2"</span>')
    .replace(/\n\n/g, '</p><p class="story-paragraph">')
    .replace(/\n/g, '<br>')
    .replace(/\*\*\*/g, '<hr class="scene-break">')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(<p class="story-paragraph">)(.{1,60})(<\/p>)/g, (match, p1, text, p2) => {
      if (text.length < 60 && !text.match(/[.,:;!?]$/)) {
        return `<h3 class="chapter-heading">${text}</h3>`;
      }
      return match;
    })
    .replace(/--/g, '&mdash;')
    .replace(
      /<p class="story-paragraph">(?!<span class="dialogue">)/g,
      '<p class="story-paragraph indented">'
    );

  if (!formatted.startsWith('<p')) {
    formatted = '<p class="story-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }

  formatted = `<div class="story-content">${formatted}</div>`;

  return formatted;
};

const formatBackstoryForDisplay = (backstory) => {
  if (!backstory) return '';

  const dialoguePattern = /(^|[\s([{\u2014-])"([^"\n]+)"(?=[\s)\]}\u2014.,!?;:]|$)/g;

  let formatted = backstory
    .replace(dialoguePattern, '$1<span class="dialogue">"$2"</span>')
    .replace(/\n\n/g, '</p><p class="backstory-paragraph">')
    .replace(/\n/g, '<br>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/--/g, '&mdash;');

  if (!formatted.startsWith('<p')) {
    formatted = '<p class="backstory-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }

  formatted = `<div class="backstory-content">${formatted}</div>`;

  return formatted;
};

/**
 * @returns {Promise<Array>}
 */
export const listSharedStoryRooms = async () => {
  return sharedStoryRoomDb.listSummaries();
};

export const formatUserMessageForDisplay = (content) => {
  if (!content) return '';

  const dialoguePattern = /(^|[\s([{\u2014-])"([^"\n]+)"(?=[\s)\]}\u2014.,!?;:]|$)/g;

  let formatted = content
    .replace(dialoguePattern, '$1<span class="dialogue">"$2"</span>')
    .replace(/\n\n/g, '</p><p class="user-paragraph">')
    .replace(/\n/g, '<br>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/--/g, '&mdash;');

  if (!formatted.startsWith('<p')) {
    formatted = '<p class="user-paragraph">' + formatted;
  }
  if (!formatted.endsWith('</p>')) {
    formatted = formatted + '</p>';
  }

  formatted = `<div class="user-content">${formatted}</div>`;

  return formatted;
};

/**
 * @param {string} roomId
 * @param {Object} heroData
 * @param {string} content
 * @returns {Promise<Object>}
 */
export const addUserMessageToRoom = async (roomId, heroData, content) => {
  const room = await loadRoom(roomId);

  if (!room) {
    throw new Error('Shared story room not found');
  }

  const isParticipant = room.participants.some((p) => p.id === heroData.id);

  if (!isParticipant) {
    throw new Error('Only participants can send messages');
  }

  const formattedContent = formatUserMessageForDisplay(content);

  const userMessage = {
    id: uuidv4(),
    sender: {
      id: heroData.id,
      name: heroData.name,
      avatar: heroData.avatar || null,
    },
    content: formattedContent,
    timestamp: new Date(),
  };

  room.messages.push(userMessage);

  const narratorPrompt = await generateSharedStoryPrompt(room);
  const narratorResponse = await generateSharedStoryResponse(narratorPrompt);

  room.messages.push({
    id: uuidv4(),
    sender: {
      id: 'system',
      name: 'Cosmic Narrator',
      avatar: '/storage/aries2.webp',
    },
    content: narratorResponse,
    timestamp: new Date(),
  });

  room.updated = new Date();
  await persistRoom(room);
  return room;
};

/**
 * Append messages and persist (used by socket layer for AI + user messages).
 * @param {string} roomId
 * @param {object[]} messages
 */
export const appendMessagesAndSave = async (roomId, messages) => {
  const room = await loadRoom(roomId);
  if (!room) throw new Error('Shared story room not found');
  for (const m of messages) {
    room.messages.push({
      ...m,
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
    });
  }
  room.updated = new Date();
  await persistRoom(room);
  return room;
};

/**
 * Update room fields and persist.
 * @param {string} roomId
 * @param {(room: object) => void} mutator
 */
export const mutateSharedStoryRoom = async (roomId, mutator) => {
  const room = await loadRoom(roomId);
  if (!room) throw new Error('Shared story room not found');
  mutator(room);
  room.updated = new Date();
  await persistRoom(room);
  return room;
};
