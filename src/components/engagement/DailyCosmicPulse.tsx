import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import { track } from '../../utils/analytics';

const PROMPTS: readonly string[] = [
    'Name one small brave act you will do today.',
    'Write a single sentence of lore for your hero before midnight.',
    'Pick one ally your hero trusts—and one they do not.',
    'Sketch (even badly) your hero\'s signature weapon or charm.',
  ];

interface DailyCosmicPulseProps {
  heroId: string;
}

const DailyCosmicPulse: React.FC<DailyCosmicPulseProps> = ({ heroId }) => {
  const [done, setDone] = useState(false);
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  useEffect(() => {
    track('quest_pulse_view', { heroId });
  }, [heroId]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 rounded-sm border border-stone-700/85 bg-stone-950/55 backdrop-blur-sm p-6 shadow-xl shadow-black/25"
      aria-labelledby="cosmic-pulse-heading"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="h-6 w-6 text-amber-500/85 shrink-0 mt-1" aria-hidden />
        <div className="flex-1">
          <h2 id="cosmic-pulse-heading" className="text-lg font-display font-semibold text-stone-100 mb-1">
            Daily pulse
          </h2>
          <p className="text-stone-400 text-sm mb-4">{prompt}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="border border-amber-900/35"
            disabled={done}
            onClick={() => {
              setDone(true);
              track('quest_pulse_complete', { heroId, prompt: prompt.slice(0, 80) });
            }}
          >
            {done ? 'Logged for today' : 'Mark as done'}
          </Button>
        </div>
      </div>
    </motion.section>
  );
};

export default DailyCosmicPulse;
