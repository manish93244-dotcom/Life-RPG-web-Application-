import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Zap,
  Filter,
  Search,
  AlertCircle,
  Clock,
  Brain,
  Sword,
  Shield,
  Hourglass,
  Flame,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { Quest, AttributeType, QuestDifficulty, QuestCompletionResult } from '../types';
import { cyberAudio, triggerNeonConfetti, triggerScreenShake } from '../lib/cyberFx';

interface QuestBoardProps {
  quests: Quest[];
  onCompleteQuest: (id: string) => Promise<QuestCompletionResult | void>;
  onCreateQuest: (data: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: QuestDifficulty;
    dueDate?: string | null;
  }) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
  onLevelUpCelebration: (data: { oldLevel: number; newLevel: number; xp: number; credits: number }) => void;
}

const DIFFICULTY_CONFIG: Record<
  QuestDifficulty,
  { label: string; badgeClass: string; borderClass: string; xp: number; credits: number; boss: boolean }
> = {
  'F-Rank': {
    label: 'F-Rank (Routine)',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    xp: 15,
    credits: 10,
    boss: false,
  },
  'C-Rank': {
    label: 'C-Rank (Medium)',
    badgeClass: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
    xp: 35,
    credits: 25,
    boss: false,
  },
  'S-Rank': {
    label: 'S-Rank (Boss Bounty)',
    badgeClass: 'bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/60 animate-pulse',
    borderClass: 'border-[#ff007f]/40 hover:border-[#ff007f] glow-magenta',
    xp: 100,
    credits: 75,
    boss: true,
  },
};

const ATTRIBUTE_ICONS: Record<AttributeType, React.ReactNode> = {
  intellect: <Brain className="w-3.5 h-3.5 text-cyan-400" />,
  strength: <Sword className="w-3.5 h-3.5 text-rose-400" />,
  vitality: <Shield className="w-3.5 h-3.5 text-emerald-400" />,
  discipline: <Hourglass className="w-3.5 h-3.5 text-amber-400" />,
};

export const QuestBoard: React.FC<QuestBoardProps> = ({
  quests,
  onCompleteQuest,
  onCreateQuest,
  onDeleteQuest,
  onLevelUpCelebration,
}) => {
  // Filters & Search
  const [selectedAttribute, setSelectedAttribute] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAttribute, setNewAttribute] = useState<AttributeType>('intellect');
  const [newDifficulty, setNewDifficulty] = useState<QuestDifficulty>('C-Rank');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Optimistic tracking
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      // Attribute filter
      if (selectedAttribute !== 'all' && quest.attribute !== selectedAttribute) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'all' && quest.difficulty !== selectedDifficulty) {
        return false;
      }
      // Status filter
      if (filterStatus === 'active' && quest.completed) return false;
      if (filterStatus === 'completed' && !quest.completed) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = quest.title.toLowerCase().includes(query);
        const matchDesc = quest.description.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [quests, selectedAttribute, selectedDifficulty, filterStatus, searchQuery]);

  const activeCount = useMemo(() => quests.filter(q => !q.completed).length, [quests]);
  const completedCount = useMemo(() => quests.filter(q => q.completed).length, [quests]);

  // Handle Optimistic Quest Completion
  const handleToggleComplete = async (quest: Quest) => {
    if (completingIds.has(quest.id)) return;

    cyberAudio.playClick();
    setCompletingIds(prev => new Set(prev).add(quest.id));

    // Instant tactile feedback
    if (!quest.completed) {
      const isBoss = quest.difficulty === 'S-Rank';
      cyberAudio.playQuestComplete(isBoss);
      triggerNeonConfetti();
      if (isBoss) {
        triggerScreenShake();
      }
    }

    try {
      const result = await onCompleteQuest(quest.id);
      if (result && result.leveledUp) {
        cyberAudio.playLevelUp();
        triggerScreenShake();
        triggerNeonConfetti();
        onLevelUpCelebration({
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
          xp: result.earnedXp,
          credits: result.earnedCredits,
        });
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to sync bounty with neural network.');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(quest.id);
        return next;
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      await onCreateQuest({
        title: newTitle.trim(),
        description: newDescription.trim(),
        attribute: newAttribute,
        difficulty: newDifficulty,
        dueDate: newDueDate || null,
      });
      cyberAudio.playCreditsGained();
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to initialize bounty directive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Board Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-cyber font-bold text-xl sm:text-2xl text-slate-100 tracking-wider flex items-center gap-2">
              <span className="text-[#00f2fe] text-glow-cyan">BOUNTY</span>
              <span>TERMINAL</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
              {activeCount} ACTIVE
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Execute cyber operations to harvest XP, build attribute mastery, and earn black market credits.
          </p>
        </div>

        {/* New Bounty Trigger Button */}
        <motion.button
          id="create-quest-btn"
          onClick={() => {
            cyberAudio.playClick();
            setIsCreateModalOpen(true);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-slate-950 font-mono font-bold text-sm shadow-lg glow-cyan transition-all hover:brightness-110"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>INITIALIZE BOUNTY</span>
        </motion.button>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 mb-6 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="quest-search-input"
              type="text"
              placeholder="Search active directives or bounties..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs font-mono focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
            <button
              id="tab-active-quests"
              onClick={() => setFilterStatus('active')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-mono transition-all ${
                filterStatus === 'active'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              id="tab-completed-quests"
              onClick={() => setFilterStatus('completed')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-mono transition-all ${
                filterStatus === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Archived ({completedCount})
            </button>
            <button
              id="tab-all-quests"
              onClick={() => setFilterStatus('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-mono transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-slate-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({quests.length})
            </button>
          </div>
        </div>

        {/* Attribute & Difficulty Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-wider">Attributes:</span>
          </div>

          {['all', 'intellect', 'strength', 'vitality', 'discipline'].map(attr => (
            <button
              key={attr}
              id={`filter-attr-${attr}`}
              onClick={() => setSelectedAttribute(attr)}
              className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-all ${
                selectedAttribute === attr
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 font-bold glow-cyan'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {attr === 'all' ? 'All Attributes' : attr}
            </button>
          ))}

          <div className="hidden sm:inline text-slate-700 mx-1">|</div>

          <div className="flex items-center gap-1.5 text-slate-400 mr-1">
            <span className="text-[11px] uppercase tracking-wider">Rank:</span>
          </div>
          {['all', 'F-Rank', 'C-Rank', 'S-Rank'].map(rank => (
            <button
              key={rank}
              id={`filter-rank-${rank}`}
              onClick={() => setSelectedDifficulty(rank)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                selectedDifficulty === rank
                  ? 'bg-amber-950 text-amber-300 border border-amber-400 font-bold glow-amber'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {rank === 'all' ? 'All Ranks' : rank}
            </button>
          ))}
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filteredQuests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-cyber font-semibold text-slate-300">
                NO ACTIVE DIRECTIVES DETECTED
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-1 max-w-sm mx-auto">
                {filterStatus === 'completed'
                  ? 'No archived bounties match this matrix filter.'
                  : 'All bounties cleared or filtered out. Initialize a new directive to resume leveling!'}
              </p>
              {filterStatus === 'active' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-3.5 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono hover:bg-cyan-900 transition-colors"
                >
                  + Add First Bounty
                </button>
              )}
            </motion.div>
          ) : (
            filteredQuests.map(quest => {
              const diffConfig = DIFFICULTY_CONFIG[quest.difficulty];
              const isBoss = quest.difficulty === 'S-Rank';
              const isCompleting = completingIds.has(quest.id);

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative p-4 rounded-xl transition-all ${
                    quest.completed
                      ? 'bg-slate-950/50 border border-slate-800/60 opacity-60'
                      : `bg-[#10121e]/90 border ${diffConfig.borderClass} shadow-md`
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox Trigger (Optimistic toggle & keyboard accessible) */}
                    <button
                      id={`quest-toggle-${quest.id}`}
                      role="checkbox"
                      aria-checked={quest.completed}
                      tabIndex={0}
                      onClick={() => handleToggleComplete(quest)}
                      onKeyDown={e => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleComplete(quest);
                        }
                      }}
                      className={`mt-0.5 p-1 rounded-lg transition-transform active:scale-90 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        quest.completed
                          ? 'text-emerald-400 hover:text-emerald-300'
                          : isBoss
                          ? 'text-[#ff007f] hover:text-[#ff007f]'
                          : 'text-slate-500 hover:text-cyan-400'
                      }`}
                      title={quest.completed ? 'Reactivate bounty' : 'Complete bounty'}
                    >
                      {quest.completed ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[2.2]" />
                      )}
                    </button>

                    {/* Quest Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Title */}
                        <h3
                          className={`text-sm sm:text-base font-mono font-medium tracking-wide ${
                            quest.completed
                              ? 'line-through text-slate-500'
                              : isBoss
                              ? 'text-slate-100 font-bold'
                              : 'text-slate-200'
                          }`}
                        >
                          {quest.title}
                        </h3>

                        {/* Difficulty Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${diffConfig.badgeClass}`}
                        >
                          {diffConfig.label}
                        </span>

                        {/* Attribute Badge */}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300 uppercase">
                          {ATTRIBUTE_ICONS[quest.attribute]}
                          <span>{quest.attribute}</span>
                        </span>
                      </div>

                      {/* Description */}
                      {quest.description && (
                        <p
                          className={`text-xs font-mono leading-relaxed mt-1 ${
                            quest.completed ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {quest.description}
                        </p>
                      )}

                      {/* Rewards & Due Date Footer */}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono">
                        {/* XP Reward */}
                        <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                          <Zap className="w-3.5 h-3.5" />
                          +{quest.xpReward} XP
                        </span>

                        {/* Credit Reward */}
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          +{quest.creditReward} CR
                        </span>

                        {/* Due Date */}
                        {quest.dueDate && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(quest.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}

                        {/* Completed Timestamp */}
                        {quest.completed && quest.completedAt && (
                          <span className="text-emerald-500/80">
                            Archived {new Date(quest.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Delete & Reactivate */}
                    <div className="flex items-center gap-1">
                      {quest.completed && (
                        <button
                          onClick={() => handleToggleComplete(quest)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Reopen directive"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        id={`delete-quest-${quest.id}`}
                        onClick={async () => {
                          cyberAudio.playClick();
                          if (confirm(`Purge bounty [${quest.title}] from database?`)) {
                            await onDeleteQuest(quest.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Purge directive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* CREATE NEW BOUNTY MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-[#0e101d] border-2 border-cyan-500/50 p-6 glow-cyan shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-cyber font-bold text-slate-100 uppercase tracking-wider">
                    PUBLISH NEW BOUNTY
                  </h2>
                </div>
                <button
                  id="close-create-quest-modal"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 font-mono">
                {/* Title */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Quest Directive / Goal *
                  </label>
                  <input
                    id="quest-title-input"
                    type="text"
                    required
                    placeholder="e.g. Master Neural Graph Algorithm"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-sm focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Mission Parameters (Description)
                  </label>
                  <textarea
                    id="quest-desc-input"
                    rows={2}
                    placeholder="Breakdown of tactical milestones or guidelines..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs focus:outline-none resize-none"
                  />
                </div>

                {/* Attribute Selector */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">
                    Target Attribute
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['intellect', 'strength', 'vitality', 'discipline'] as AttributeType[]).map(attr => (
                      <button
                        type="button"
                        key={attr}
                        id={`select-attr-${attr}`}
                        onClick={() => setNewAttribute(attr)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs capitalize transition-all ${
                          newAttribute === attr
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 font-bold glow-cyan'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {ATTRIBUTE_ICONS[attr]}
                        <span>{attr}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Rank Selector */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1.5">
                    Difficulty Rank & Rewards
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(['F-Rank', 'C-Rank', 'S-Rank'] as QuestDifficulty[]).map(diff => {
                      const cfg = DIFFICULTY_CONFIG[diff];
                      const isSelected = newDifficulty === diff;
                      return (
                        <button
                          type="button"
                          key={diff}
                          id={`select-diff-${diff}`}
                          onClick={() => setNewDifficulty(diff)}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-400 text-slate-100 font-bold glow-cyan'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold">{cfg.label}</div>
                          <div className="text-[10px] text-cyan-400 mt-0.5">
                            +{cfg.xp} XP | +{cfg.credits} CR
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Due Date (Optional) */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    id="quest-due-input"
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    id="submit-quest-btn"
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#0284c7] text-slate-950 font-bold text-xs glow-cyan transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Uploading to Grid...' : 'Commit Bounty Directive'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
