import { v4 as uuidv4 } from 'uuid';
import {
  getSharedStoryRoom,
  mutateSharedStoryRoom,
  appendMessagesAndSave,
  generateSharedStoryPrompt,
  generateSharedStoryResponse,
} from './sharedStory.js';
import {
  isOpenAIQuotaError,
  checkOpenAIQuotaExceeded,
  setOpenAIQuotaExceeded,
} from './openai.js';
import { applyProgressEvent } from './progression.js';

/**
 * Append a user-facing message, broadcast it, then maybe run Cosmic Narrator + progression.
 * @param {import('socket.io').Server} io
 * @param {string} roomId
 * @param {{ id: string, name: string, avatar?: string|null }} sender
 * @param {string} plainContent
 * @param {object} [extra]
 * @param {string} heroIdForProgression - hero whose book/level advances on narrator beat
 */
export async function appendUserMessageAndMaybeNarrator(
  io,
  roomId,
  sender,
  plainContent,
  extra,
  heroIdForProgression
) {
  const newMessage = {
    id: uuidv4(),
    sender: {
      id: sender.id,
      name: sender.name,
      avatar: sender.avatar || null,
    },
    content: plainContent,
    timestamp: new Date(),
    ...(extra || {}),
  };

  await mutateSharedStoryRoom(roomId, (r) => {
    r.messages.push(newMessage);
  });

  io.to(roomId).emit('message', newMessage);

  const room = await getSharedStoryRoom(roomId);
  if (!room) return;

  const userMsgCount = room.messages.filter((m) => m.sender.id !== 'system').length;
  if (userMsgCount % 3 !== 0 || userMsgCount === 0) {
    return;
  }

  if (checkOpenAIQuotaExceeded()) {
    const errorMessage = {
      id: uuidv4(),
      sender: {
        id: 'system',
        name: 'System',
        avatar: null,
      },
      content:
        'The Cosmic Narrator is taking a brief rest. Our cosmic energies (API quota) have been temporarily depleted. Please try again later.',
      timestamp: new Date(),
      isError: true,
    };
    await appendMessagesAndSave(roomId, [errorMessage]);
    io.to(roomId).emit('message', errorMessage);
    return;
  }

  io.to(roomId).emit('narrator_typing');

  const prompt = await generateSharedStoryPrompt(room);
  const startTime = Date.now();

  try {
    const responseContent = await generateSharedStoryResponse(prompt);
    const responseTime = Date.now() - startTime;
    const MIN_TYPING_TIME = 3500;
    if (responseTime < MIN_TYPING_TIME) {
      await new Promise((resolve) => setTimeout(resolve, MIN_TYPING_TIME - responseTime));
    }

    const aiMessage = {
      id: uuidv4(),
      sender: {
        id: 'system',
        name: 'Cosmic Narrator',
        avatar: null,
      },
      content: responseContent,
      timestamp: new Date(),
    };

    await appendMessagesAndSave(roomId, [aiMessage]);
    io.to(roomId).emit('message', aiMessage);

    await applyProgressEvent(heroIdForProgression, 'narrator_beat', {
      source: 'shared_story',
      roomId,
    }).catch((e) => console.error('progression narrator_beat:', e));
  } catch (aiError) {
    console.error('Error generating AI response:', aiError);

    if (isOpenAIQuotaError(aiError)) {
      setOpenAIQuotaExceeded(true);
      const errorMessage = {
        id: uuidv4(),
        sender: {
          id: 'system',
          name: 'System',
          avatar: null,
        },
        content:
          'The Cosmic Narrator is taking a brief rest. Our cosmic energies (API quota) have been temporarily depleted. Please try again later.',
        timestamp: new Date(),
        isError: true,
      };
      await appendMessagesAndSave(roomId, [errorMessage]);
      io.to(roomId).emit('message', errorMessage);
    }
  }
}
