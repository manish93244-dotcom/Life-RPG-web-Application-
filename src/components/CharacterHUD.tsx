import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Sword,
  Shield,
  Hourglass,
  Coins,
  Flame,
  Zap,
  PlusCircle,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
  Bot,
  Swords,
  EyeOff,
  CircuitBoard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User, AttributeType } from '../types';
import { cyberAudio } from '../lib/cyberFx';

interface CharacterHUDProps {
  user: User;
  onAllocateStat: (attribute: AttributeType) => Promise<void>;
  onLogout: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const ATTRIBUTE_CONFIG: Record<
  AttributeType,
  {
    name: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    glowClass: string;
    bgProgress: string;
    tagline: string;
  }
> = {
  intellect: {
    name: 'Intellect',
    icon: <Brain className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowClass: 'glow-cyan',
    bgProgress: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
    tagline: 'Cognition & Tech Mastery',
  },
  strength: {
    name: 'Strength',
    icon: <Sword className="w-4 h-4 text-rose-400" />,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    glowClass: 'glow-magenta',
    bgProgress: 'bg-gradient-to-r from-rose-600 to-rose-400',
    tagline: 'Physical Power & Grit',
  },
  vitality: {
    name: 'Vitality',
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    bgProgress: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    tagline: 'Health, Sleep & Stamina',
  },
  discipline: {
    name: 'Discipline',
    icon: <Hourglass className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowClass: 'glow-amber',
    bgProgress: 'bg-gradient-to-r from-amber-600 to-amber-400',
    tagline: 'Focus & Execution Habits',
  },
};

export const CharacterHUD: React.FC<CharacterHUDProps> = ({
  user,
  onAllocateStat,
  onLogout,
  isSoundEnabled,
  onToggleSound,
}) => {
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [allocatingAttr, setAllocatingAttr] = useState<AttributeType | null>(null);

  const xpPercent = Math.min(100, Math.round((user.xp / (user.xpRequired || 100)) * 100));

  const handleAllocate = async (attr: AttributeType) => {
    if (user.statPoints <= 0) return;
    setAllocatingAttr(attr);
    try {
      await onAllocateStat(attr);
      cyberAudio.playCreditsGained();
    } finally {
      setAllocatingAttr(null);
    }
  };

  const renderAvatarIcon = (avatarId: string) => {
    switch (avatarId) {
      case 'neon-samurai':
        return <Swords className="w-7 h-7 text-pink-400" />;
      case 'shadow-operative':
        return <EyeOff className="w-7 h-7 text-purple-400" />;
      case 'ai-android':
        return <CircuitBoard className="w-7 h-7 text-cyan-300" />;
      default:
        return <Bot className="w-7 h-7 text-cyan-400" />;
    }
  };

  return (
    <header className="w-full bg-[#0d0e18]/90 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-30">
      {/* Top Status Ticker */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Operative Identity & Level */}
          <div className="flex items-center gap-3">
            {/* Avatar Frame with Cyber Glow */}
            <div className="relative group">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-cyan-500/60 flex items-center justify-center glow-cyan transition-all group-hover:border-cyan-400">
                {renderAvatarIcon(user.avatar)}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff007f] text-white tracking-widest shadow-sm">
                LVL {user.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-cyber font-bold text-slate-100 text-sm tracking-wider uppercase">
                  {user.username}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  {user.title || 'Novice Netrunner'}
                </span>
              </div>

              {/* Character Level XP Bar */}
              <div className="mt-1 flex items-center gap-2">
                <div className="w-28 sm:w-44 h-2 bg-slate-950 rounded-full overflow-hidden border border-cyan-900/60">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#00f2fe] via-[#38bdf8] to-[#ff007f]"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[11px] font-mono text-cyan-400/90 whitespace-nowrap">
                  {user.xp} / {user.xpRequired} XP ({xpPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Credits, Streak, Stat Points) */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {/* Credits Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/30 glow-amber text-amber-300 text-xs sm:text-sm font-mono"
              title="Cyber Credits (CR)"
            >
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold">{user.credits.toLocaleString()}</span>
              <span className="text-[10px] text-amber-400/70 hidden sm:inline">CR</span>
            </div>

            {/* Daily Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/30 glow-magenta text-rose-300 text-xs sm:text-sm font-mono"
              title="Daily Consecutive Bounty Streak"
            >
              <Flame className="w-4 h-4 text-rose-400 fill-rose-500/20 animate-bounce" />
              <span className="font-bold">{user.streak}d</span>
              <span className="text-[10px] text-rose-400/70 hidden sm:inline">STREAK</span>
            </div>

            {/* Unallocated Stat Points Notification */}
            {user.statPoints > 0 && (
              <motion.button
                id="hud-stat-points-btn"
                onClick={() => setIsStatsExpanded(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff007f]/20 border border-[#ff007f] text-[#ff007f] text-xs font-mono font-bold animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+{user.statPoints} STAT PTS</span>
              </motion.button>
            )}

            {/* Expand / Collapse Attribute Radar Drawer */}
            <button
              id="hud-toggle-attributes-btn"
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <span>Attributes</span>
              {isStatsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              id="hud-sound-toggle-btn"
              onClick={onToggleSound}
              title={isSoundEnabled ? 'Mute Cyber Audio FX' : 'Enable Cyber Audio FX'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Logout */}
            <button
              id="hud-logout-btn"
              onClick={onLogout}
              title="Disconnect Neural Link (Logout)"
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attribute Breakdown Bars (Expandable Panel) */}
        <AnimatePresence>
          {isStatsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-cyan-500/20 mt-3 pt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-cyber font-bold uppercase tracking-wider text-cyan-300">
                    Neural Attribute Matrix
                  </h2>
                </div>
                {user.statPoints > 0 ? (
                  <span className="text-[11px] font-mono text-[#ff007f] font-bold">
                    ★ {user.statPoints} unallocated stat points available!
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400">
                    Earn XP via Quests to level up attributes
                  </span>
                )}
              </div>

              {/* Grid of 4 Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-1">
                {(Object.keys(ATTRIBUTE_CONFIG) as AttributeType[]).map(attrKey => {
                  const config = ATTRIBUTE_CONFIG[attrKey];
                  const attrStat = user.attributes[attrKey] || { level: 1, xp: 0, xpRequired: 60 };
                  const percent = Math.min(
                    100,
                    Math.round((attrStat.xp / (attrStat.xpRequired || 60)) * 100)
                  );

                  return (
                    <div
                      key={attrKey}
                      className={`p-3 rounded-xl bg-slate-900/90 border ${config.borderColor} transition-all`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span className={`text-xs font-bold font-mono ${config.color}`}>
                            {config.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-100">
                            LVL {attrStat.level}
                          </span>
                          {user.statPoints > 0 && (
                            <button
                              id={`allocate-${attrKey}-btn`}
                              disabled={allocatingAttr === attrKey}
                              onClick={() => handleAllocate(attrKey)}
                              title={`Allocate 1 Stat Point to ${config.name}`}
                              className="p-1 rounded bg-[#ff007f]/20 hover:bg-[#ff007f]/40 text-[#ff007f] border border-[#ff007f]/50 transition-transform active:scale-95"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{config.tagline}</span>
                        <span>{percent}%</span>
                      </div>

                      <div className="mt-1 w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                          className={`h-full ${config.bgProgress}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>

                      <div className="mt-1 text-[10px] font-mono text-slate-500 text-right">
                        {attrStat.xp} / {attrStat.xpRequired} XP
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
