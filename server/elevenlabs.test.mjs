// Unit tests for narrator HTML stripping. Synthesis itself is a thin wrapper
// over ElevenLabs HTTP and exercised by manual QA / integration; we pin the
// pre-TTS text shaping here because that is where regressions would silently
// produce inaudible noise (markup read aloud) or send oversize requests.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  NarrationError,
  narratorHtmlToSpokenText,
  getOrSynthesizeNarration,
  isElevenLabsConfigured,
} from './elevenlabs.js';

test('narratorHtmlToSpokenText handles non-string inputs as empty', () => {
  assert.equal(narratorHtmlToSpokenText(null), '');
  assert.equal(narratorHtmlToSpokenText(undefined), '');
  assert.equal(narratorHtmlToSpokenText(''), '');
  // @ts-expect-no-error — defensive against accidental non-strings on payload.
  assert.equal(narratorHtmlToSpokenText(123), '');
});

test('narratorHtmlToSpokenText strips inline tags and decodes entities', () => {
  const html =
    '<p class="x">She whispered <em>"to the stars"</em>&mdash;then vanished.</p>';
  const text = narratorHtmlToSpokenText(html);
  assert.equal(text, 'She whispered "to the stars"—then vanished.');
});

test('narratorHtmlToSpokenText converts block tags to paragraph breaks', () => {
  const html =
    '<div class="story-content">' +
    '<p class="story-paragraph">First beat of the tale.</p>' +
    '<hr class="scene-break">' +
    '<p class="story-paragraph">Second beat after the scene break.</p>' +
    '</div>';
  const text = narratorHtmlToSpokenText(html);
  assert.equal(
    text,
    'First beat of the tale.\n\nSecond beat after the scene break.'
  );
});

test('narratorHtmlToSpokenText decodes numeric entities and known named entities', () => {
  const html = '<p>Caf&#233; opens at &nbsp;dawn&hellip;</p>';
  const text = narratorHtmlToSpokenText(html);
  assert.equal(text, 'Café opens at dawn…');
});

test('narratorHtmlToSpokenText drops <style>/<script> bodies entirely', () => {
  const html =
    '<style>.x{color:red}</style><p>Visible prose.</p><script>alert(1)</script>';
  const text = narratorHtmlToSpokenText(html);
  assert.equal(text, 'Visible prose.');
});

test('narratorHtmlToSpokenText caps very long text near a sentence boundary', () => {
  const sentence = 'The hero strode forth across the cold, glittering void. ';
  const big = sentence.repeat(200); // ≈ 11_400 chars
  const text = narratorHtmlToSpokenText(`<p>${big}</p>`);
  assert.ok(text.length <= 4500, `expected <=4500 chars, got ${text.length}`);
  assert.ok(text.length > 4000, 'expected close-to-cap output, not a tiny stub');
  assert.match(text, /[.!?…]$/);
});

test('narratorHtmlToSpokenText collapses excessive whitespace from welcome cards', () => {
  const html = `<div class="system-message welcome-message">
      <h3 class="welcome-heading">A New Cosmic Adventure Begins</h3>
      <p class="welcome-text">Welcome, Lyra, to your cosmic adventure!</p>
      <p class="welcome-text">Your story unfolds from your origins:</p>
    </div>`;
  const text = narratorHtmlToSpokenText(html);
  assert.equal(
    text,
    [
      'A New Cosmic Adventure Begins',
      'Welcome, Lyra, to your cosmic adventure!',
      'Your story unfolds from your origins:',
    ].join('\n\n')
  );
});

test('isElevenLabsConfigured accepts ELEVENLABS_API_KEY and XI_API_KEY', () => {
  const prevEleven = process.env.ELEVENLABS_API_KEY;
  const prevXi = process.env.XI_API_KEY;
  try {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.XI_API_KEY;
    assert.equal(isElevenLabsConfigured(), false);

    process.env.ELEVENLABS_API_KEY = '   ';
    assert.equal(isElevenLabsConfigured(), false);

    process.env.XI_API_KEY = 'xi-key';
    assert.equal(isElevenLabsConfigured(), true);

    delete process.env.XI_API_KEY;
    assert.equal(isElevenLabsConfigured(), false);
    delete process.env.ELEVENLABS_API_KEY;

    process.env.XI_API_KEY = 'xi-key';
    assert.equal(isElevenLabsConfigured(), true);

    delete process.env.XI_API_KEY;
    process.env.ELEVENLABS_API_KEY = '  eleven-key  ';
    assert.equal(isElevenLabsConfigured(), true);
  } finally {
    if (prevEleven === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = prevEleven;
    }
    if (prevXi === undefined) {
      delete process.env.XI_API_KEY;
    } else {
      process.env.XI_API_KEY = prevXi;
    }
  }
});

test('getOrSynthesizeNarration caches synthesized mp3 by room and message', async () => {
  const prevCwd = process.cwd();
  const prevEleven = process.env.ELEVENLABS_API_KEY;
  const prevFetch = globalThis.fetch;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'olympus-elevenlabs-test-'));

  try {
    process.chdir(tmpDir);
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const unique = Date.now().toString(36);
    const roomId = `room-${unique}`;
    const messageId = `msg-${unique}`;

    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      return {
        ok: true,
        arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
      };
    };

    const first = await getOrSynthesizeNarration({
      roomId,
      messageId,
      text: 'The stars sing softly tonight.',
    });
    const second = await getOrSynthesizeNarration({
      roomId,
      messageId,
      text: 'The stars sing softly tonight.',
    });

    assert.equal(calls, 1, 'expected one network synthesis call with cache hit');
    assert.deepEqual(first, second);
    assert.ok(first.length > 0);
  } finally {
    process.chdir(prevCwd);
    if (prevEleven === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = prevEleven;
    }
    globalThis.fetch = prevFetch;
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test('getOrSynthesizeNarration maps ElevenLabs HTTP 402 to quota error', async () => {
  const prevCwd = process.cwd();
  const prevEleven = process.env.ELEVENLABS_API_KEY;
  const prevFetch = globalThis.fetch;
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'olympus-elevenlabs-402-'));

  try {
    process.chdir(tmpDir);
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const unique = Date.now().toString(36);
    const roomId = `room-402-${unique}`;
    const messageId = `msg-402-${unique}`;

    globalThis.fetch = async () => ({
      ok: false,
      status: 402,
      text: async () => '{"detail":{"status":"quota_exceeded"}}',
    });

    await assert.rejects(
      () =>
        getOrSynthesizeNarration({
          roomId,
          messageId,
          text: 'Short line for TTS.',
        }),
      (err) =>
        err instanceof NarrationError &&
        err.code === 'ELEVENLABS_QUOTA_EXHAUSTED' &&
        err.status === 402
    );
  } finally {
    process.chdir(prevCwd);
    if (prevEleven === undefined) {
      delete process.env.ELEVENLABS_API_KEY;
    } else {
      process.env.ELEVENLABS_API_KEY = prevEleven;
    }
    globalThis.fetch = prevFetch;
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
