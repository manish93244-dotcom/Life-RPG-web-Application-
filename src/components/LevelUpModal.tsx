import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Zap, Coins, ArrowRight, X } from 'lucide-react';

interface LevelUpModalProps {
  data: {
    oldLevel: number;
    newLevel: number;
    xp: number;
    credits: number;
  };
  onClose: () => void;
  onOpenStats: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  data,
  onClose,
  onOpenStats,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-[#0f111e] border-2 border-cyan-400 p-6 glow-cyan-strong text-center relative overflow-hidden shadow-2xl"
      >
        {/* Decorative corner brackets */}
        <div className="absolute top-2 left-2 text-cyan-500/40 text-[10px] font-mono">
          [SYS://OVERCLOCK_SUCCESS]
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glowing Trophy Icon */}
        <div className="w-20 h-20 mx-auto mt-2 mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-[#ff007f]/20 to-amber-500/20 border border-cyan-400/50 flex items-center justify-center glow-cyan">
          <Trophy className="w-10 h-10 text-cyan-300 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-cyber font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] via-[#fff] to-[#ff007f] uppercase">
          OPERATIVE LEVEL UP!
        </h2>
        <p className="text-xs font-mono text-cyan-400 mt-1 uppercase tracking-widest">
          Neural Capacity Overclocked
        </p>

        {/* Level Progression Indicator */}
        <div className="my-6 py-3 px-6 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center gap-4">
          <div className="text-slate-400 font-mono">
            <span className="text-xs block text-slate-500">PREVIOUS</span>
            <span className="text-lg font-bold">LVL {data.oldLevel}</span>
          </div>

          <ArrowRight className="w-5 h-5 text-[#00f2fe] animate-pulse" />

          <div className="text-cyan-300 font-mono">
            <span className="text-xs block text-cyan-400/70 font-semibold">CURRENT</span>
            <span className="text-2xl font-black text-glow-cyan">LVL {data.newLevel}</span>
          </div>
        </div>

        {/* Rewards Unlocked */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs text-left">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-[#ff007f]/40 glow-magenta">
            <div className="flex items-center gap-1.5 text-[#ff007f] font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>+2 STAT POINTS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enhance Intellect, Strength, Vitality, or Discipline.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 glow-amber">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <Coins className="w-4 h-4" />
              <span>+{data.credits} CREDITS</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ready to spend in the Black Market Armory.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenStats();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-slate-950 font-mono font-bold text-xs glow-cyan transition-all hover:brightness-110"
          >
            ALLOCATE STAT POINTS
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-mono text-xs transition-colors"
          >
            CONTINUE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
