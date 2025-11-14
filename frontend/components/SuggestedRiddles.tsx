'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SUGGESTED_RIDDLES = [
  { riddle: "What has keys but no locks?", answer: "piano" },
  { riddle: "I speak without a mouth and hear without ears. What am I?", answer: "echo" },
  { riddle: "The more you take, the more you leave behind. What am I?", answer: "footsteps" },
  { riddle: "I can be cracked, made, told, and played. What am I?", answer: "joke" },
  { riddle: "What has a head, a tail, is brown, and has no legs?", answer: "penny" },
  { riddle: "I'm tall when I'm young, and short when I'm old. What am I?", answer: "candle" },
  { riddle: "What goes up but never comes down?", answer: "age" },
  { riddle: "I have cities, but no houses. I have mountains, but no trees. What am I?", answer: "map" },
];

interface SuggestedRiddlesProps {
  onSelect: (riddle: string, answer: string) => void;
}

export default function SuggestedRiddles({ onSelect }: SuggestedRiddlesProps) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Suggested riddles:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_RIDDLES.slice(0, 2).map((item, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelect(item.riddle, item.answer)}
            className="px-2.5 py-1.5 text-xs bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 dark:text-blue-500 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all touch-manipulation min-h-[32px]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {item.riddle}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

