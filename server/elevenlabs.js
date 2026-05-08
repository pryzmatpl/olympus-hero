// ElevenLabs text-to-speech for Cosmic Narrator passages.
// Strips narrator HTML to clean prose, synthesizes via ElevenLabs, and caches
// per-message MP3s under storage/narration/{roomId}/{messageId}.mp3 so the
// same passage replays instantly without re-billing the API.
//
// Required env: ELEVENLABS_API_KEY (or XI_API_KEY)
// Optional env: ELEVENLABS_VOICE_ID (default: MKlLqCItoCkvdhrxgtLv)
//               ELEVENLABS_MODEL_ID (default: eleven_multilingual_v2)
//               ELEVENLABS_API_BASE_URL — API root ending in /v1, e.g.:
//               https://api.elevenlabs.io/v1 (default)
//               https://api.eu.residency.elevenlabs.io/v1 (EU isolated / enterprise)
//               https://api.us.elevenlabs.io/v1 — see ElevenLabs "Create speech" / data residency docs
//               ELEVENLABS_OUTPUT_FORMAT — query default mp3_44100_128 (see text-to-speech convert API)

import path from 'node:path';
import fs from 'node:fs/promises';

const DEFAULT_ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';

function elevenApiBaseUrl() {
  const raw =
    typeof process.env.ELEVENLABS_API_BASE_URL === 'string'
      ? process.env.ELEVENLABS_API_BASE_URL.trim()
      : '';
  return (raw || DEFAULT_ELEVEN_API_BASE).replace(/\/+$/, '');
}

function elevenOutputFormat() {
  const raw =
    typeof process.env.ELEVENLABS_OUTPUT_FORMAT === 'string'
      ? process.env.ELEVENLABS_OUTPUT_FORMAT.trim()
      : '';
  return raw || 'mp3_44100_128';
}
function elevenTimeoutMs() {
  const raw =
    typeof process.env.ELEVENLABS_TIMEOUT_MS === 'string'
      ? Number(process.env.ELEVENLABS_TIMEOUT_MS)
      : NaN;
  if (!Number.isFinite(raw)) return 90_000;
  return Math.min(300_000, Math.max(10_000, Math.trunc(raw)));
}
const DEFAULT_VOICE_ID = 'MKlLqCItoCkvdhrxgtLv';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';
/** Multilingual v2 hard caps single requests; 4500 leaves headroom for whitespace. */
const MAX_SPOKEN_CHARS = 4500;

const NARRATION_DIR = path.join(process.cwd(), 'storage', 'narration');

const HTML_ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&lsquo;': "'",
  '&rsquo;': "'",
};

export function isElevenLabsConfigured() {
  return Boolean(getElevenLabsApiKey());
}

function getElevenLabsApiKey() {
  const eleven =
    typeof process.env.ELEVENLABS_API_KEY === 'string'
      ? process.env.ELEVENLABS_API_KEY.trim()
      : '';
  if (eleven) return eleven;
  const xi =
    typeof process.env.XI_API_KEY === 'string' ? process.env.XI_API_KEY.trim() : '';
  return xi || '';
}

/**
 * Convert narrator HTML (from sharedStory.formatStoryContentForDisplay and
 * literaryFormatter output) into clean prose suitable for TTS synthesis.
 * Block-level tags become paragraph breaks; inline tags vanish.
 *
 * @param {string|undefined|null} html
 * @returns {string}
 */
export function narratorHtmlToSpokenText(html) {
  if (typeof html !== 'string' || !html) return '';

  let text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr[^>]*>/gi, '\n\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section)>/gi, '\n\n')
    // Inline tag boundaries (e.g. </em>—then) must collapse without injecting
    // a stray space, otherwise punctuation is voiced separated from its word.
    .replace(/<[^>]+>/g, '');

  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    text = text.split(entity).join(replacement);
  }
  text = text.replace(/&#(\d+);/g, (_, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCodePoint(n) : ' ';
  });
  text = text.replace(/&[a-z0-9]+;/gi, ' ');

  text = text
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length > MAX_SPOKEN_CHARS) {
    const cutoff = text.lastIndexOf(' ', MAX_SPOKEN_CHARS);
    text = text.slice(0, cutoff > MAX_SPOKEN_CHARS - 200 ? cutoff : MAX_SPOKEN_CHARS).trimEnd();
    if (!/[.!?…"]$/.test(text)) {
      text += '…';
    }
  }

  return text;
}

/**
 * @typedef {Object} ElevenLabsError
 * @property {number} [status]
 * @property {string} code
 */

class NarrationError extends Error {
  /**
   * @param {string} message
   * @param {{ code: string, status?: number }} opts
   */
  constructor(message, { code, status }) {
    super(message);
    this.code = code;
    if (typeof status === 'number') this.status = status;
  }
}

async function synthesizeFromElevenLabs(text) {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new NarrationError('ELEVENLABS_API_KEY is not configured', {
      code: 'ELEVENLABS_NOT_CONFIGURED',
      status: 503,
    });
  }
  const voiceId = (process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID).trim();
  const modelId = (process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID).trim();
  const elevenBase = elevenApiBaseUrl();
  const ttsUrl = new URL(`${elevenBase}/text-to-speech/${encodeURIComponent(voiceId)}`);
  ttsUrl.searchParams.set('output_format', elevenOutputFormat());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), elevenTimeoutMs());
  let response;
  try {
    response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/octet-stream, audio/mpeg;q=0.9, */*;q=0.8',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.42,
          similarity_boost: 0.78,
          style: 0.32,
          use_speaker_boost: true,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new NarrationError('ElevenLabs request timed out', {
        code: 'ELEVENLABS_TIMEOUT',
        status: 504,
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    /** ElevenLabs returns 402 when account credits/quota do not cover the request */
    if (response.status === 402) {
      throw new NarrationError(
        `ElevenLabs quota or credits (${response.status}): ${body.slice(0, 240)}`,
        { code: 'ELEVENLABS_QUOTA_EXHAUSTED', status: response.status }
      );
    }
    if (response.status === 401) {
      const normalized = body.toLowerCase();
      const code = normalized.includes('invalid_api_key')
        ? 'ELEVENLABS_INVALID_API_KEY'
        : 'ELEVENLABS_REQUEST_UNAUTHORIZED';
      throw new NarrationError(
        `ElevenLabs authorization failed (${response.status}): ${body.slice(0, 240)}`,
        { code, status: response.status }
      );
    }
    if (response.status === 403) {
      const normalized = body.toLowerCase();
      const code = normalized.includes('voice')
        ? 'ELEVENLABS_VOICE_ACCESS_DENIED'
        : 'ELEVENLABS_REQUEST_FORBIDDEN';
      throw new NarrationError(
        `ElevenLabs forbidden (${response.status}): ${body.slice(0, 240)}`,
        { code, status: response.status }
      );
    }
    throw new NarrationError(
      `ElevenLabs request failed (${response.status}): ${body.slice(0, 240)}`,
      { code: 'ELEVENLABS_REQUEST_FAILED', status: response.status }
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new NarrationError('ElevenLabs returned empty audio', {
      code: 'ELEVENLABS_EMPTY_AUDIO',
      status: 502,
    });
  }
  return buffer;
}

/** Reject path-traversal-ish inputs before composing a cache file path. */
function sanitizeId(id) {
  const safe = String(id || '').replace(/[^a-zA-Z0-9._-]/g, '');
  return safe;
}

/**
 * Synthesize and cache narration audio for a stable (roomId, messageId) key.
 * Cached audio lives at storage/narration/{roomId}/{messageId}.mp3 — narrator
 * messages are immutable once posted, so the cache key never goes stale.
 *
 * @param {{ roomId: string, messageId: string, text: string }} args
 * @returns {Promise<Buffer>}
 */
export async function getOrSynthesizeNarration({ roomId, messageId, text }) {
  const safeRoomId = sanitizeId(roomId);
  const safeMessageId = sanitizeId(messageId);
  if (!safeRoomId || !safeMessageId) {
    throw new NarrationError('Invalid roomId or messageId for narration cache', {
      code: 'INVALID_CACHE_KEY',
      status: 400,
    });
  }
  if (!text) {
    throw new NarrationError('No narratable text provided', {
      code: 'EMPTY_NARRATION_TEXT',
      status: 400,
    });
  }

  const dir = path.join(NARRATION_DIR, safeRoomId);
  const file = path.join(dir, `${safeMessageId}.mp3`);

  try {
    return await fs.readFile(file);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.warn('narration cache read failed:', err.message || err);
    }
  }

  const audio = await synthesizeFromElevenLabs(text);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, audio);
  } catch (err) {
    console.warn('narration cache write failed:', err?.message || err);
  }
  return audio;
}

export { NarrationError };
