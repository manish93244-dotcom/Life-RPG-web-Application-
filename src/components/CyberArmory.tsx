import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Coins,
  Check,
  Zap,
  Shield,
  Palette,
  Bot,
  Terminal,
  Swords,
  EyeOff,
  CircuitBoard,
  Cpu,
  Sword,
  ShieldAlert,
  Hourglass,
  Sparkles,
  SunMedium,
  Lock,
} from 'lucide-react';
import { ShopItem, ItemCategory, ItemRarity, User } from '../types';
import { cyberAudio } from '../lib/cyberFx';

interface CyberArmoryProps {
  user: User;
  items: (ShopItem & { owned: boolean; equipped: boolean; inventoryId: string | null })[];
  onBuyItem: (itemId: string) => Promise<void>;
  onEquipItem: (inventoryId: string) => Promise<void>;
}

const RARITY_COLORS: Record<ItemRarity, { text: string; bg: string; border: string; glow: string }> = {
  Common: {
    text: 'text-slate-300',
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    glow: '',
  },
  Rare: {
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-500/50',
    glow: 'glow-cyan',
  },
  Epic: {
    text: 'text-purple-300',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/50',
    glow: 'glow-magenta',
  },
  Legendary: {
    text: 'text-amber-300',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500/60',
    glow: 'glow-amber',
  },
};

export const CyberArmory: React.FC<CyberArmoryProps> = ({
  user,
  items,
  onBuyItem,
  onEquipItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [armoryMessage, setArmoryMessage] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleBuy = async (item: ShopItem) => {
    if (user.credits < item.price) {
      setArmoryMessage(`Insufficient credits! You need ${item.price - user.credits} more CR.`);
      setTimeout(() => setArmoryMessage(null), 3000);
      return;
    }

    setLoadingItemId(item.id);
    try {
      await onBuyItem(item.id);
      cyberAudio.playCreditsGained();
      setArmoryMessage(`Acquired [${item.name}]! Added to cyber-deck.`);
      setTimeout(() => setArmoryMessage(null), 3500);
    } catch (err: any) {
      setArmoryMessage(err.message || 'Transaction failed on the black market grid.');
      setTimeout(() => setArmoryMessage(null), 3500);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleEquip = async (inventoryId: string, itemName: string) => {
    setLoadingItemId(inventoryId);
    try {
      await onEquipItem(inventoryId);
      cyberAudio.playClick();
      setArmoryMessage(`Equipped [${itemName}] to operative profile!`);
      setTimeout(() => setArmoryMessage(null), 3000);
    } catch (err: any) {
      setArmoryMessage(err.message || 'Failed to equip item.');
    } finally {
      setLoadingItemId(null);
    }
  };

  const renderItemIcon = (iconName: string, category: ItemCategory) => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-6 h-6 text-cyan-400" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-cyan-300" />;
      case 'Sword':
      case 'Swords':
        return <Sword className="w-6 h-6 text-rose-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-6 h-6 text-amber-400" />;
      case 'Bot':
        return <Bot className="w-6 h-6 text-cyan-400" />;
      case 'EyeOff':
        return <EyeOff className="w-6 h-6 text-purple-400" />;
      case 'CircuitBoard':
        return <CircuitBoard className="w-6 h-6 text-cyan-300" />;
      case 'Palette':
        return <Palette className="w-6 h-6 text-cyan-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-pink-400" />;
      case 'SunMedium':
        return <SunMedium className="w-6 h-6 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-cyan-400" />;
      case 'Hourglass':
        return <Hourglass className="w-6 h-6 text-amber-400" />;
      case 'Shield':
        return <Shield className="w-6 h-6 text-emerald-400" />;
      default:
        return <ShoppingBag className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Armory Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-cyber font-bold text-xl sm:text-2xl text-slate-100 tracking-wider flex items-center gap-2">
              <span className="text-[#ff007f] text-glow-magenta">CYBER</span>
              <span>ARMORY</span>
              <span className="text-slate-500 font-mono text-sm">/ BLACK MARKET</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Exchange bounty credits for certified operative titles, cyberware modules, and neural hologram avatars.
          </p>
        </div>

        {/* Credit Balance Indicator */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 glow-amber text-amber-300 font-mono">
          <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase text-amber-400/80">Available Credits</div>
            <div className="text-base sm:text-lg font-bold">{user.credits.toLocaleString()} CR</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {armoryMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-xs font-mono flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{armoryMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-2 border-b border-slate-800 font-mono text-xs">
        {[
          { id: 'all', label: 'All Catalog' },
          { id: 'title', label: 'Badges & Titles' },
          { id: 'avatar', label: 'Operative Avatars' },
          { id: 'theme', label: 'HUD Themes' },
          { id: 'cyberware', label: 'Cyberware Hardware' },
        ].map(tab => (
          <button
            key={tab.id}
            id={`armory-tab-${tab.id}`}
            onClick={() => {
              cyberAudio.playClick();
              setSelectedCategory(tab.id);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              selectedCategory === tab.id
                ? 'bg-gradient-to-r from-[#ff007f] to-[#be185d] text-white font-bold glow-magenta shadow-md'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Armory Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const rarity = RARITY_COLORS[item.rarity];
          const canAfford = user.credits >= item.price;
          const isLoading = loadingItemId === (item.owned ? item.inventoryId : item.id);

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col justify-between p-4 rounded-xl bg-[#10121e] border ${rarity.border} ${
                item.equipped ? 'border-cyan-400 glow-cyan' : rarity.glow
              } shadow-lg relative group`}
            >
              <div>
                {/* Header with Icon, Category and Rarity */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {renderItemIcon(item.icon, item.category)}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${rarity.bg} ${rarity.text} border ${rarity.border}`}
                    >
                      {item.rarity}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Name & Description */}
                <h3 className="text-sm font-mono font-bold text-slate-100 mb-1 group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 leading-relaxed min-h-[36px]">
                  {item.description}
                </p>

                {/* Stat Bonus Tag if any */}
                {item.statBonus && (
                  <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>{item.statBonus}</span>
                  </div>
                )}
              </div>

              {/* Action Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {/* Price Display */}
                <div className="flex items-center gap-1 font-mono text-xs">
                  {item.owned ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      OWNED
                    </span>
                  ) : item.price === 0 ? (
                    <span className="text-cyan-400 font-bold">FREE STARTER</span>
                  ) : (
                    <span className={`font-bold flex items-center gap-1 ${canAfford ? 'text-amber-300' : 'text-slate-500'}`}>
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      {item.price} CR
                    </span>
                  )}
                </div>

                {/* Interactive Equip or Buy Button */}
                {item.owned ? (
                  item.equipped ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50 glow-cyan flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      EQUIPPED
                    </span>
                  ) : (
                    <button
                      id={`equip-item-${item.id}`}
                      disabled={isLoading}
                      onClick={() => handleEquip(item.inventoryId!, item.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/50 border border-slate-700 text-slate-300 transition-all active:scale-95"
                    >
                      {isLoading ? 'SYNCING...' : 'EQUIP'}
                    </button>
                  )
                ) : (
                  <button
                    id={`buy-item-${item.id}`}
                    disabled={isLoading || !canAfford}
                    onClick={() => handleBuy(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-95 flex items-center gap-1 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 glow-amber'
                        : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {!canAfford && <Lock className="w-3 h-3" />}
                    {isLoading ? 'SECURING...' : 'PURCHASE'}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
