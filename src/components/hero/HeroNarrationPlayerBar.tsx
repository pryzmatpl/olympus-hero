import React from 'react';
import { BookOpen, Loader2, Pause, Play, Square, Volume2, X } from 'lucide-react';
import type { UseHeroNarrationResult, HeroNarrationAssetId } from '../../hooks/useHeroNarration';

interface HeroNarrationPlayerBarProps {
  heroDisplayName: string;
  narration: UseHeroNarrationResult;
}

function labelForAsset(
  assetOptions: { id: HeroNarrationAssetId; label: string }[],
  id: HeroNarrationAssetId | null
): string {
  if (!id) return '';
  const hit = assetOptions.find((o) => o.id === id);
  return hit?.label ?? '';
}

const HeroNarrationPlayerBar: React.FC<HeroNarrationPlayerBarProps> = ({
  heroDisplayName,
  narration,
}) => {
  const {
    assetOptions,
    activeAssetId,
    status,
    error,
    currentTime,
    duration,
    audiobookMode,
    toggleAsset,
    stop,
    toggleAudiobook,
    seekToFraction,
  } = narration;

  const progress =
    duration > 0 && Number.isFinite(currentTime) ? Math.min(1, currentTime / duration) : 0;

  const title = labelForAsset(assetOptions, activeAssetId);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-900/40 bg-stone-950/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
      role="region"
      aria-label="Hero narration player"
    >
      <div className="container mx-auto max-w-6xl px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-700/50 bg-amber-950/40 text-amber-400">
              <Volume2 className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 truncate">
                {heroDisplayName}
                {audiobookMode ? ' · Audiobook' : ''}
              </p>
              <p className="text-sm font-medium text-stone-100 truncate">
                {title || 'Narration'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-stone-400">
              <span className="hidden sm:inline">Track</span>
              <select
                className="max-w-[11rem] sm:max-w-xs rounded-sm border border-stone-600 bg-stone-900/90 px-2 py-1.5 text-sm text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                value={activeAssetId ?? ''}
                onChange={(e) => {
                  const v = e.target.value as HeroNarrationAssetId;
                  if (v) narration.playAsset(v);
                }}
                disabled={assetOptions.length === 0 || status === 'loading'}
              >
                <option value="">Choose…</option>
                {assetOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => activeAssetId && toggleAsset(activeAssetId)}
              disabled={!activeAssetId || status === 'loading'}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-950/45 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
            >
              {status === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : status === 'playing' ? (
                <Pause className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden />
              )}
              {status === 'playing' ? 'Pause' : status === 'loading' ? 'Loading' : 'Play'}
            </button>

            <button
              type="button"
              onClick={() => toggleAudiobook()}
              disabled={assetOptions.length === 0}
              title="Play backstory and all unlocked chapters in order"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:cursor-not-allowed disabled:opacity-50 ${
                audiobookMode
                  ? 'border-amber-500/70 bg-amber-900/50 text-amber-50'
                  : 'border-stone-600 bg-stone-900/80 text-stone-200 hover:border-amber-600/50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Audiobook
            </button>

            <button
              type="button"
              onClick={() => stop()}
              className="inline-flex items-center gap-1 rounded-full border border-stone-600 bg-stone-900/80 p-1.5 text-stone-300 hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
              aria-label="Stop and dismiss player"
            >
              <Square className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] tabular-nums text-stone-500 w-10 text-right">
            {formatClock(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => seekToFraction(parseFloat(e.target.value))}
            disabled={!activeAssetId || status === 'loading' || duration <= 0}
            className="flex-1 accent-amber-500 h-1.5"
            aria-label="Playback position"
          />
          <span className="text-[10px] tabular-nums text-stone-500 w-10">
            {formatClock(duration)}
          </span>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-300/95 flex items-start gap-1.5">
            <X className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default HeroNarrationPlayerBar;
