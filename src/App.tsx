import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListTodo,
  ShoppingBag,
  Activity,
  Terminal,
  Wifi,
  Sparkles,
  Zap,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { User, Quest, ShopItem, AttributeType, QuestDifficulty, QuestCompletionResult } from './types';
import { api, setStoredToken, getStoredToken } from './lib/api';
import { cyberAudio } from './lib/cyberFx';
import { CharacterHUD } from './components/CharacterHUD';
import { QuestBoard } from './components/QuestBoard';
import { CyberArmory } from './components/CyberArmory';
import { LevelUpModal } from './components/LevelUpModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [armoryItems, setArmoryItems] = useState<
    (ShopItem & { owned: boolean; equipped: boolean; inventoryId: string | null })[]
  >([]);

  const [activeTab, setActiveTab] = useState<'quests' | 'armory'>('quests');
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(cyberAudio.isSoundEnabled());
  const [levelUpCelebration, setLevelUpCelebration] = useState<{
    oldLevel: number;
    newLevel: number;
    xp: number;
    credits: number;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3500);
  }, []);

  // Fetch all user session data
  const refreshAllData = useCallback(async () => {
    try {
      const [sessionRes, questsRes, armoryRes] = await Promise.all([
        api.getCurrentSession(),
        api.getQuests(),
        api.getArmoryCatalog(),
      ]);
      setUser(sessionRes.user);
      setQuests(questsRes.quests);
      setArmoryItems(armoryRes.catalog);
    } catch (err: any) {
      console.error('Session refresh failed:', err);
      // If token expired, clear user
      setUser(null);
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      setIsLoadingSession(true);
      const token = getStoredToken();
      if (token) {
        try {
          await refreshAllData();
        } catch {
          setUser(null);
        }
      } else {
        // Automatically log into demo account on first visit so preview works immediately!
        try {
          const res = await api.demoLogin();
          setStoredToken(res.token);
          await refreshAllData();
        } catch (err) {
          console.error('Auto demo login fallback failed:', err);
        }
      }
      setIsLoadingSession(false);
    };

    initSession();
  }, [refreshAllData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === '1') {
        setActiveTab('quests');
        cyberAudio.playClick();
      } else if (e.key === '2') {
        setActiveTab('armory');
        cyberAudio.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth Handlers
  const handleLogin = async (identifier: string, pass: string) => {
    const res = await api.login(identifier, pass);
    setStoredToken(res.token);
    await refreshAllData();
    showToast(`Neural link online. Welcome back, ${res.user.username}.`);
  };

  const handleRegister = async (username: string, email: string, pass: string, avatar: string) => {
    const res = await api.register(username, email, pass, avatar);
    setStoredToken(res.token);
    await refreshAllData();
    showToast(`Operative ${res.user.username} registered to the grid!`);
  };

  const handleDemoLogin = async () => {
    const res = await api.demoLogin();
    setStoredToken(res.token);
    await refreshAllData();
    showToast('Demo operative [Neo_Cipher] connected.');
  };

  const handleLogout = async () => {
    cyberAudio.playClick();
    await api.logout();
    setUser(null);
    setQuests([]);
    setArmoryItems([]);
  };

  const handleToggleSound = () => {
    const next = cyberAudio.toggleSound();
    setIsSoundEnabled(next);
  };

  // Quest Actions with Optimistic UI
  const handleCompleteQuest = async (questId: string): Promise<QuestCompletionResult | void> => {
    const originalQuest = quests.find(q => q.id === questId);
    if (!originalQuest) return;

    const willBeCompleted = !originalQuest.completed;

    // Optimistic UI update: instantly flip quest status on screen
    setQuests(prev =>
      prev.map(q =>
        q.id === questId
          ? {
              ...q,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : null,
            }
          : q
      )
    );

    try {
      const result = await api.completeQuest(questId);
      // Sync server-authoritative state
      setUser(result.user);
      setQuests(prev => prev.map(q => (q.id === questId ? result.quest : q)));

      if (willBeCompleted) {
        showToast(
          `+${result.earnedXp} XP | +${result.earnedCredits} CR ${
            result.streakIncremented ? `| STREAK: ${result.user.streak}d 🔥` : ''
          }`
        );
      }

      return result;
    } catch (err: any) {
      // Rollback on failure
      setQuests(prev => prev.map(q => (q.id === questId ? originalQuest : q)));
      showToast('Network error: Failed to record bounty completion.');
      throw err;
    }
  };

  const handleCreateQuest = async (data: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: QuestDifficulty;
    dueDate?: string | null;
  }) => {
    const res = await api.createQuest(data);
    setQuests(prev => [res.quest, ...prev]);
    showToast(`Bounty directive published: [${res.quest.title}]`);
  };

  const handleDeleteQuest = async (id: string) => {
    await api.deleteQuest(id);
    setQuests(prev => prev.filter(q => q.id !== id));
    showToast('Bounty purged from terminal.');
  };

  // Armory Actions
  const handleBuyItem = async (itemId: string) => {
    const res = await api.buyItem(itemId);
    setUser(res.user);
    // Refresh catalog to reflect ownership
    const catalogRes = await api.getArmoryCatalog();
    setArmoryItems(catalogRes.catalog);
  };

  const handleEquipItem = async (inventoryId: string) => {
    const res = await api.equipItem(inventoryId);
    setUser(res.user);
    const catalogRes = await api.getArmoryCatalog();
    setArmoryItems(catalogRes.catalog);
  };

  // Stat Point Allocation
  const handleAllocateStat = async (attribute: AttributeType) => {
    const res = await api.allocateStat(attribute);
    setUser(res.user);
    showToast(`Enhanced ${attribute.toUpperCase()} to Level ${res.user.attributes[attribute].level}!`);
  };

  // Loading Screen
  if (isLoadingSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0a12] text-slate-200 font-mono">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-cyan-400 glow-cyan flex items-center justify-center mb-4 animate-pulse">
          <Terminal className="w-8 h-8 text-[#00f2fe]" />
        </div>
        <div className="text-sm font-cyber uppercase tracking-widest text-[#00f2fe] text-glow-cyan mb-2">
          INITIALIZING LIFE RPG TERMINAL...
        </div>
        <div className="text-xs text-slate-500">Connecting neural subroutines & memory banks</div>
      </div>
    );
  }

  // If Not Authenticated, render Auth View
  if (!user) {
    return (
      <AuthModal
        onLoginSuccess={(u) => setUser(u)}
        onDemoLogin={handleDemoLogin}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div id="rpg-terminal-root" className="min-h-screen bg-[#0a0a12] text-slate-200 cyber-grid flex flex-col relative">
      {/* HUD Header */}
      <CharacterHUD
        user={user}
        onAllocateStat={handleAllocateStat}
        onLogout={handleLogout}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Navigation Sub-Header (Cyberpunk Tabs) */}
      <nav className="w-full bg-[#0d0e19]/60 border-b border-slate-800/80 backdrop-blur-sm sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-2">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              id="nav-tab-quests"
              onClick={() => {
                cyberAudio.playClick();
                setActiveTab('quests');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'quests'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-400 glow-cyan'
                  : 'bg-slate-900/40 text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <ListTodo className="w-4 h-4 text-cyan-400" />
              <span>BOUNTY BOARD</span>
              <span className="hidden sm:inline text-[10px] text-cyan-400/60">[Key: 1]</span>
            </button>

            <button
              id="nav-tab-armory"
              onClick={() => {
                cyberAudio.playClick();
                setActiveTab('armory');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'armory'
                  ? 'bg-[#ff007f]/20 text-[#ff007f] font-bold border border-[#ff007f] glow-magenta'
                  : 'bg-slate-900/40 text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#ff007f]" />
              <span>CYBER ARMORY</span>
              <span className="hidden sm:inline text-[10px] text-[#ff007f]/60">[Key: 2]</span>
            </button>
          </div>

          {/* Terminal Signal Status */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              SECURE GRID UPLINK
            </span>
            <span>|</span>
            <span className="text-slate-400">XP Math: 100 × Lvl^1.5</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'quests' ? (
            <motion.div
              key="tab-quests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <QuestBoard
                quests={quests}
                onCompleteQuest={handleCompleteQuest}
                onCreateQuest={handleCreateQuest}
                onDeleteQuest={handleDeleteQuest}
                onLevelUpCelebration={(data) => setLevelUpCelebration(data)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tab-armory"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CyberArmory
                user={user}
                items={armoryItems}
                onBuyItem={handleBuyItem}
                onEquipItem={handleEquipItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Celebratory Level Up Modal */}
      <AnimatePresence>
        {levelUpCelebration && (
          <LevelUpModal
            data={levelUpCelebration}
            onClose={() => setLevelUpCelebration(null)}
            onOpenStats={() => {
              setLevelUpCelebration(null);
              // Trigger attribute view expansion
              const attrBtn = document.getElementById('hud-toggle-attributes-btn');
              if (attrBtn) attrBtn.click();
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Cyber Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 p-3.5 px-5 rounded-xl bg-slate-950/90 border-2 border-[#00f2fe] text-cyan-300 font-mono text-xs glow-cyan shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#00f2fe] animate-spin" />
            <span className="font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Status Footer */}
      <footer className="w-full bg-[#08090f] border-t border-slate-900 py-3 text-center text-[11px] font-mono text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#00f2fe]">LIFE RPG TERMINAL v2.6.4</span>
            <span>•</span>
            <span>CYBERPUNK LIFE GAMIFICATION ENGINE</span>
          </div>
          <div className="text-slate-500">
            Authenticated as <span className="text-slate-300 font-semibold">{user.username}</span> [{user.title}]
          </div>
        </div>
      </footer>
    </div>
  );
}
