// Deterministic in-process stub for the OpenAI surface used by the
// server. Swapped in via the loader hook in `./loader.mjs`. Only the
// names actually imported by server modules under test are exported;
// add new ones here if more openai functions get pulled into the
// integration suite.

let _quotaExceeded = false;
let _shouldThrowQuotaOnGenerate = false;
let _generateChapterCalls = 0;

export function isOpenAIQuotaError(err) {
  if (!err) return false;
  return (
    (err.status === 429 && err.code === 'insufficient_quota') ||
    err?.error?.code === 'insufficient_quota' ||
    /exceeded your current quota/i.test(err?.message || '')
  );
}

export function isOpenAIAuthOrConfigError(err) {
  if (!err) return false;
  return err.status === 401 || err.code === 'invalid_api_key';
}

export function checkOpenAIQuotaExceeded() {
  return _quotaExceeded;
}

export function setOpenAIQuotaExceeded(value) {
  _quotaExceeded = Boolean(value);
}

export async function generateChapter(heroName, _heroData, _userPrompt, chapterNumber) {
  _generateChapterCalls += 1;
  if (_shouldThrowQuotaOnGenerate) {
    const err = new Error('OpenAI API quota exceeded (test stub)');
    err.status = 429;
    err.code = 'insufficient_quota';
    throw err;
  }
  return {
    content: `Stub Chapter ${chapterNumber} for ${heroName}`,
    summary: `Stub summary ch${chapterNumber}`,
  };
}

export async function generateOpenAIImages() {
  return [
    { angle: 'front', url: '/storage/stub-front.png', prompt: 'stub' },
    { angle: 'side', url: '/storage/stub-side.png', prompt: 'stub' },
    { angle: 'back', url: '/storage/stub-back.png', prompt: 'stub' },
  ];
}

export async function generateBackstory() {
  return 'Stub backstory crafted for tests.';
}

export async function generateChatCompletionWithOpenAI() {
  return 'Stub chat completion content.';
}

// Test-only control surface.
export const __testControls = {
  setShouldThrowQuotaOnGenerate(value) {
    _shouldThrowQuotaOnGenerate = Boolean(value);
  },
  generateChapterCallCount() {
    return _generateChapterCalls;
  },
  reset() {
    _quotaExceeded = false;
    _shouldThrowQuotaOnGenerate = false;
    _generateChapterCalls = 0;
  },
};
