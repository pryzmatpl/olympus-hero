import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarHeart, Scroll, Sparkles, Pencil, Trash2, Plus } from 'lucide-react';
import Button from '../ui/Button';
import api from '../../utils/api';
import { track } from '../../utils/analytics';
import type { HeroLoreEntry } from '../../store/heroStore';
import { useHeroStore } from '../../store/heroStore';
import { useNotification } from '../../context/NotificationContext';

const LORE_LINE_MAX = 480;

function localDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDay(isoDay: string) {
  const [yy, mm, dd] = isoDay.split('-').map(Number);
  if (!yy || !mm || !dd) return isoDay;
  const dt = new Date(yy, mm - 1, dd);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function sortJournal(entries: HeroLoreEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

interface HeroLoreJournalProps {
  heroId: string;
}

const HeroLoreJournal: React.FC<HeroLoreJournalProps> = ({ heroId }) => {
  const { showNotification } = useNotification();
  const loreJournal = useHeroStore((s) => s.loreJournal);
  const setLoreJournal = useHeroStore((s) => s.setLoreJournal);

  const todayKey = useMemo(() => localDayKey(), []);
  const todaysPulse = useMemo(
    () => loreJournal.find((e) => e.kind === 'pulse' && e.pulseDay === todayKey),
    [loreJournal, todayKey],
  );

  const [pulseDraft, setPulseDraft] = useState(todaysPulse?.text ?? '');
  useEffect(() => {
    setPulseDraft(todaysPulse?.text ?? '');
  }, [todaysPulse?.text, todayKey]);

  const [noteDraft, setNoteDraft] = useState('');
  const [savingPulse, setSavingPulse] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const mergedList = useMemo(() => sortJournal(loreJournal), [loreJournal]);

  useEffect(() => {
    track('lore_journal_view', { heroId });
  }, [heroId]);

  const mergeResponse = useCallback(
    (rows: HeroLoreEntry[]) => {
      const normalized = rows.map((e) => ({
        id: e.id,
        text: e.text,
        kind: e.kind === 'pulse' ? ('pulse' as const) : ('note' as const),
        pulseDay: e.pulseDay,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
      setLoreJournal(sortJournal(normalized));
    },
    [setLoreJournal],
  );

  const handleSavePulse = async () => {
    const trimmed = pulseDraft.trim();
    if (!trimmed) {
      showNotification('info', 'Empty line', 'Write one sentence—or a sparkling fragment.');
      return;
    }
    if (trimmed.length > LORE_LINE_MAX) {
      showNotification(
        'error',
        'Too long',
        `Keep today's line under ${LORE_LINE_MAX} characters.`,
      );
      return;
    }
    try {
      setSavingPulse(true);
      const res = await api.post(`/api/heroes/${heroId}/lore`, {
        mode: 'pulse',
        pulseDay: todayKey,
        text: trimmed,
      });
      mergeResponse(res.data.loreJournal);
      track('lore_pulse_save', { heroId, day: todayKey });
      showNotification(
        'success',
        todaysPulse ? 'Updated for today' : 'Saved for today',
        'Your legend grows one line at a time.',
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showNotification(
        'error',
        'Could not save',
        ax.response?.data?.message ?? 'Try again in a moment.',
      );
    } finally {
      setSavingPulse(false);
    }
  };

  const handleAddNote = async () => {
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      showNotification('info', 'Empty note', 'Add a thought, rumor, or side detail.');
      return;
    }
    try {
      setSavingNote(true);
      const res = await api.post(`/api/heroes/${heroId}/lore`, {
        mode: 'note',
        text: trimmed,
      });
      mergeResponse(res.data.loreJournal);
      setNoteDraft('');
      track('lore_note_add', { heroId });
      showNotification('success', 'Note added', 'Stacked neatly in the journal.');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showNotification(
        'error',
        'Could not add note',
        ax.response?.data?.message ?? 'Try again shortly.',
      );
    } finally {
      setSavingNote(false);
    }
  };

  const startEdit = (e: HeroLoreEntry) => {
    setEditingId(e.id);
    setEditDraft(e.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    try {
      setBusyId(editingId);
      const res = await api.patch(`/api/heroes/${heroId}/lore/${editingId}`, {
        text: trimmed,
      });
      mergeResponse(res.data.loreJournal);
      cancelEdit();
      track('lore_edit', { heroId });
      showNotification('success', 'Revised', 'The scroll has been rewritten.');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showNotification(
        'error',
        'Could not save edit',
        ax.response?.data?.message ?? 'Try again shortly.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm('Remove this line from the journal?')) return;
    try {
      setBusyId(id);
      const res = await api.delete(`/api/heroes/${heroId}/lore/${id}`);
      mergeResponse(res.data.loreJournal);
      track('lore_delete', { heroId });
    } catch {
      showNotification('error', 'Could not delete', 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const midnightLabel = useMemo(() => {
    const now = new Date(clock);
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    const ms = Math.max(0, end.getTime() - now.getTime());
    if (ms <= 0) return '';
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m left tonight`;
  }, [clock]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 rounded-sm border border-amber-900/30 bg-gradient-to-b from-stone-950/80 via-stone-950/60 to-stone-950/90 backdrop-blur-sm p-6 sm:p-7 shadow-xl shadow-black/30"
      aria-labelledby="hero-lore-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-500/15 border border-amber-500/25 p-2.5">
            <Scroll className="h-6 w-6 text-amber-400" aria-hidden />
          </div>
          <div>
            <h2
              id="hero-lore-heading"
              className="text-xl font-display font-semibold text-amber-100/95 tracking-tight"
            >
              Lore journal
            </h2>
            <p className="text-stone-400 text-sm mt-1 max-w-prose leading-relaxed">
              Write a single sentence of lore for your hero before midnight—then stack extra notes anytime.
              Tiny lines train the voice of your legend.
            </p>
          </div>
        </div>
        {midnightLabel && (
          <div className="flex items-center gap-1.5 text-xs text-amber-200/70 border border-amber-900/35 bg-amber-950/25 px-2.5 py-1 rounded-sm">
            <CalendarHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{midnightLabel}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-amber-700/35 bg-stone-950/55 p-4 sm:p-5 ring-1 ring-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden />
            <h3 className="text-sm font-semibold text-stone-100 uppercase tracking-[0.12em]">
              Daily pulse
            </h3>
          </div>
          <p className="text-stone-500 text-xs mb-3">
            {todaysPulse
              ? `You already etched today (${formatDisplayDay(todayKey)}). Rewrite freely.`
              : `Blank canvas for ${formatDisplayDay(todayKey)}.`}
          </p>
          <textarea
            value={pulseDraft}
            onChange={(ev) => setPulseDraft(ev.target.value)}
            rows={4}
            maxLength={LORE_LINE_MAX}
            placeholder="One sentence—a habit, omen, promise, scar, taste of home…"
            className="w-full rounded-sm bg-stone-900/85 border border-stone-700/90 text-stone-100 placeholder:text-stone-600 text-sm px-3 py-2.5 resize-y min-h-[5.25rem] focus:outline-none focus:ring-2 focus:ring-amber-700/55 focus:border-amber-700/55"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <span className="text-[11px] text-stone-500 tabular-nums">
              {pulseDraft.length}/{LORE_LINE_MAX}
            </span>
            <Button
              type="button"
              size="sm"
              className="border border-amber-800/50 bg-amber-950/40 text-amber-100"
              isLoading={savingPulse}
              disabled={savingPulse}
              onClick={() => void handleSavePulse()}
            >
              {todaysPulse ? "Update today's line" : "Save today's line"}
            </Button>
          </div>
        </div>

        <div className="rounded-sm border border-stone-700/80 bg-stone-950/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-stone-400" aria-hidden />
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-[0.12em]">
              Free-form notes
            </h3>
          </div>
          <p className="text-stone-500 text-xs mb-3">
            Side facts, riddles, relationships—anything that does not belong to the nightly single line.
          </p>
          <textarea
            value={noteDraft}
            onChange={(ev) => setNoteDraft(ev.target.value)}
            rows={4}
            maxLength={LORE_LINE_MAX}
            placeholder="Drop a detail you will thank yourself for later…"
            className="w-full rounded-sm bg-stone-900/70 border border-stone-700/90 text-stone-100 placeholder:text-stone-600 text-sm px-3 py-2.5 resize-y min-h-[5.25rem] focus:outline-none focus:ring-2 focus:ring-stone-600/80"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
            <span className="text-[11px] text-stone-500 tabular-nums">
              {noteDraft.length}/{LORE_LINE_MAX}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="border border-stone-600/80"
              isLoading={savingNote}
              disabled={savingNote}
              onClick={() => void handleAddNote()}
            >
              Add to journal
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-3">
          Your lines (newest first)
        </h3>
        {mergedList.length === 0 ? (
          <p className="text-stone-500 text-sm py-6 text-center border border-dashed border-stone-700/70 rounded-sm">
            The first line is the hardest. Write one bright sentence above.
          </p>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {mergedList.map((entry) => (
                <motion.li
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="group rounded-sm border border-stone-700/75 bg-stone-900/40 px-3.5 py-3 sm:px-4 sm:py-3.5 flex gap-3"
                >
                  <div className="pt-0.5 shrink-0" aria-hidden>
                    {entry.kind === 'pulse' ? (
                      <Sparkles className="h-4 w-4 text-amber-400/90" />
                    ) : (
                      <Scroll className="h-4 w-4 text-stone-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500">
                        {entry.kind === 'pulse' ? 'Daily pulse' : 'Note'}
                      </span>
                      {entry.kind === 'pulse' && entry.pulseDay && (
                        <span className="text-[10px] text-amber-200/70 border border-amber-900/40 px-1.5 py-0.5 rounded-sm">
                          {formatDisplayDay(entry.pulseDay)}
                        </span>
                      )}
                    </div>
                    {editingId === entry.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editDraft}
                          onChange={(ev) => setEditDraft(ev.target.value)}
                          rows={3}
                          maxLength={LORE_LINE_MAX}
                          className="w-full rounded-sm bg-stone-950 border border-stone-600 text-stone-100 text-sm px-2.5 py-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            isLoading={busyId === entry.id}
                            disabled={busyId === entry.id}
                            onClick={() => void saveEdit()}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === entry.id}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-200/95 text-sm leading-relaxed whitespace-pre-wrap">
                        {entry.text}
                      </p>
                    )}
                  </div>
                  {editingId !== entry.id && (
                    <div className="flex flex-col sm:flex-row gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="p-1.5 rounded-sm text-stone-400 hover:text-amber-200 hover:bg-amber-950/40"
                        aria-label="Edit lore line"
                        disabled={busyId === entry.id}
                        onClick={() => startEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-sm text-stone-400 hover:text-rose-300 hover:bg-rose-950/30"
                        aria-label="Delete lore line"
                        disabled={busyId === entry.id}
                        onClick={() => void removeEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.section>
  );
};

export default HeroLoreJournal;
