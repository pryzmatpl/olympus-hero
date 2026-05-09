import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';

export type HeroNarrationAssetId = 'backstory' | `chapter-${number}`;

export interface NarrationAssetOption {
  id: HeroNarrationAssetId;
  label: string;
}

function isChapterId(id: HeroNarrationAssetId): id is `chapter-${number}` {
  return id !== 'backstory' && /^chapter-\d+$/.test(id);
}

function chapterNumFromId(id: HeroNarrationAssetId): number | null {
  if (id === 'backstory') return null;
  const m = /^chapter-(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : null;
}

function assetToPath(heroId: string, id: HeroNarrationAssetId): string {
  if (id === 'backstory') return `/api/heroes/${heroId}/narration/backstory`;
  const n = chapterNumFromId(id);
  if (n == null || !Number.isFinite(n)) throw new Error('invalid_asset');
  return `/api/heroes/${heroId}/narration/chapter/${n}`;
}

export type HeroNarrationStatus = 'idle' | 'loading' | 'playing' | 'error';

export interface UseHeroNarrationResult {
  assetOptions: NarrationAssetOption[];
  activeAssetId: HeroNarrationAssetId | null;
  status: HeroNarrationStatus;
  error: string | null;
  currentTime: number;
  duration: number;
  audiobookMode: boolean;
  showPlayerChrome: boolean;
  toggleAsset: (id: HeroNarrationAssetId) => void;
  playAsset: (id: HeroNarrationAssetId) => void;
  stop: () => void;
  toggleAudiobook: () => void;
  seekToFraction: (fraction: number) => void;
}

async function parseBlobErrorMessage(data: Blob): Promise<{ message?: string; error?: string }> {
  try {
    const t = await data.text();
    return JSON.parse(t) as { message?: string; error?: string };
  } catch {
    return {};
  }
}

export function useHeroNarration(
  heroId: string | null,
  opts: {
    backstory: string;
    chapters: Array<{ chapter_number: number; is_unlocked: boolean; content?: string }>;
    voiceAvailable: boolean;
  }
): UseHeroNarrationResult {
  const { backstory, chapters, voiceAvailable } = opts;

  const [activeAssetId, setActiveAssetId] = useState<HeroNarrationAssetId | null>(null);
  const [status, setStatus] = useState<HeroNarrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audiobookMode, setAudiobookMode] = useState(false);
  const [hasPausedBlob, setHasPausedBlob] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audiobookQueueRef = useRef<HeroNarrationAssetId[]>([]);
  const audiobookIdxRef = useRef(0);
  const loadAndPlayRef = useRef<(id: HeroNarrationAssetId, fromChain: boolean) => Promise<void>>(
    async () => {}
  );

  const assetOptions = useMemo((): NarrationAssetOption[] => {
    const out: NarrationAssetOption[] = [];
    if (typeof backstory === 'string' && backstory.trim()) {
      out.push({ id: 'backstory', label: 'Backstory' });
    }
    const sorted = [...chapters]
      .filter((c) => c.is_unlocked && String(c.content || '').trim())
      .sort((a, b) => a.chapter_number - b.chapter_number);
    for (const c of sorted) {
      out.push({
        id: `chapter-${c.chapter_number}` as HeroNarrationAssetId,
        label: `Chapter ${c.chapter_number}`,
      });
    }
    return out;
  }, [backstory, chapters]);

  const releaseBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setHasPausedBlob(false);
  }, []);

  const stopInternal = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    releaseBlob();
    setAudiobookMode(false);
    audiobookQueueRef.current = [];
    audiobookIdxRef.current = 0;
    setActiveAssetId(null);
    setStatus('idle');
    setError(null);
    setCurrentTime(0);
    setDuration(0);
  }, [releaseBlob]);

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    return audio;
  }, []);

  const loadAndPlay = useCallback(
    async (id: HeroNarrationAssetId, fromChain: boolean) => {
      if (!heroId || !voiceAvailable) return;
      const audio = ensureAudio();
      if (!fromChain) {
        abortRef.current?.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setActiveAssetId(id);
      setStatus('loading');
      setError(null);
      releaseBlob();

      try {
        const response = await api.get(assetToPath(heroId, id), {
          responseType: 'blob',
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(response.data as Blob);
        blobUrlRef.current = url;
        setHasPausedBlob(true);
        audio.src = url;
        await audio.play();
        if (controller.signal.aborted) return;
        setStatus('playing');
      } catch (e: unknown) {
        const ax = e as {
          code?: string;
          name?: string;
          response?: { status?: number; data?: Blob | { message?: string; error?: string } };
        };
        if (controller.signal.aborted || ax.code === 'ERR_CANCELED' || ax.name === 'CanceledError') {
          return;
        }
        let message = 'Could not play narration. Please try again.';
        let errorKey: string | undefined;
        const data = ax.response?.data;
        if (data instanceof Blob) {
          const parsed = await parseBlobErrorMessage(data);
          errorKey = parsed?.error;
          if (parsed?.message) message = String(parsed.message);
        } else if (data && typeof data === 'object') {
          const obj = data as { message?: string; error?: string };
          errorKey = obj.error;
          message = obj.message || obj.error || message;
        }
        if (ax.response?.status === 503 && errorKey === 'narration_unavailable') {
          message = 'Voice narration is not configured on this server.';
        }
        if (ax.response?.status === 403 && errorKey === 'chapter_locked') {
          message = 'This chapter is not unlocked yet.';
        }
        console.error('Hero narration request failed:', e);
        releaseBlob();
        setStatus('error');
        setError(message);
        setAudiobookMode(false);
        audiobookQueueRef.current = [];
      }
    },
    [heroId, voiceAvailable, ensureAudio, releaseBlob]
  );

  loadAndPlayRef.current = loadAndPlay;

  useEffect(() => {
    const audio = ensureAudio();
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      const queue = audiobookQueueRef.current;
      const idx = audiobookIdxRef.current;
      if (queue.length > 0 && idx + 1 < queue.length) {
        audiobookIdxRef.current = idx + 1;
        const nextId = queue[idx + 1];
        void loadAndPlayRef.current(nextId, true);
      } else {
        audiobookQueueRef.current = [];
        audiobookIdxRef.current = 0;
        setAudiobookMode(false);
        setActiveAssetId(null);
        setStatus('idle');
        setCurrentTime(0);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        setHasPausedBlob(false);
        audio.removeAttribute('src');
        audio.load();
      }
    };
    const onPlayErr = () => {
      setStatus('error');
      setError('Audio playback failed.');
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onPlayErr);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onPlayErr);
    };
  }, [ensureAudio]);

  const playAsset = useCallback(
    (id: HeroNarrationAssetId) => {
      setAudiobookMode(false);
      audiobookQueueRef.current = [];
      void loadAndPlay(id, false);
    },
    [loadAndPlay]
  );

  const toggleAsset = useCallback(
    async (id: HeroNarrationAssetId) => {
      if (!heroId || !voiceAvailable) return;
      const audio = ensureAudio();

      if (activeAssetId === id) {
        if (status === 'playing') {
          audio.pause();
          setStatus('idle');
          setHasPausedBlob(Boolean(audio.src));
          return;
        }
        if (status === 'loading') return;
        if (status === 'idle' && audio.src) {
          try {
            await audio.play();
            setStatus('playing');
            setHasPausedBlob(true);
          } catch (err) {
            console.error(err);
            setStatus('error');
            setError('Could not resume playback.');
          }
          return;
        }
        if (status === 'error') {
          void loadAndPlay(id, false);
          return;
        }
      }

      setAudiobookMode(false);
      audiobookQueueRef.current = [];
      void loadAndPlay(id, false);
    },
    [heroId, voiceAvailable, activeAssetId, status, ensureAudio, loadAndPlay]
  );

  const stop = useCallback(() => {
    stopInternal();
  }, [stopInternal]);

  const toggleAudiobook = useCallback(() => {
    if (!heroId || !voiceAvailable) return;
    const ids = assetOptions.map((o) => o.id);
    if (ids.length === 0) {
      setError('Nothing to play yet.');
      setStatus('error');
      return;
    }
    const audio = ensureAudio();
    if (audiobookMode && (status === 'playing' || status === 'loading')) {
      audio.pause();
      setAudiobookMode(false);
      audiobookQueueRef.current = [];
      setStatus('idle');
      setHasPausedBlob(Boolean(audio.src));
      return;
    }
    setAudiobookMode(true);
    audiobookQueueRef.current = [...ids];
    audiobookIdxRef.current = 0;
    void loadAndPlay(ids[0], false);
  }, [heroId, voiceAvailable, assetOptions, audiobookMode, status, ensureAudio, loadAndPlay]);

  const seekToFraction = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration) || duration <= 0) return;
    const t = Math.min(Math.max(fraction, 0), 1) * duration;
    audio.currentTime = t;
    setCurrentTime(t);
  }, [duration]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const showPlayerChrome =
    Boolean(activeAssetId) &&
    (status === 'loading' ||
      status === 'playing' ||
      status === 'error' ||
      (status === 'idle' && hasPausedBlob));

  return {
    assetOptions,
    activeAssetId,
    status,
    error,
    currentTime,
    duration,
    audiobookMode,
    showPlayerChrome,
    toggleAsset,
    playAsset,
    stop,
    toggleAudiobook,
    seekToFraction,
  };
}

export { chapterNumFromId, isChapterId };
