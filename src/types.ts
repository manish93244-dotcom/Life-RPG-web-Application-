export type AttributeType = 'intellect' | 'strength' | 'vitality' | 'discipline';

export type QuestDifficulty = 'F-Rank' | 'C-Rank' | 'S-Rank';

export interface AttributeStats {
  level: number;
  xp: number;
  xpRequired: number;
}

export interface UserAttributes {
  intellect: AttributeStats;
  strength: AttributeStats;
  vitality: AttributeStats;
  discipline: AttributeStats;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  title: string;
  theme: string;
  level: number;
  xp: number;
  xpRequired: number;
  credits: number;
  statPoints: number;
  streak: number;
  lastActiveDate: string | null;
  attributes: UserAttributes;
  createdAt: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  attribute: AttributeType;
  difficulty: QuestDifficulty;
  xpReward: number;
  creditReward: number;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory = 'title' | 'avatar' | 'theme' | 'cyberware';
export type ItemRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  price: number;
  icon: string;
  value: string; // The title string, avatar image/icon identifier, or theme class
  statBonus?: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  item: ShopItem;
  equipped: boolean;
  acquiredAt: string;
}

export interface QuestCompletionResult {
  quest: Quest;
  user: User;
  earnedXp: number;
  earnedCredits: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  streakIncremented: boolean;
  streakBonusCredits: number;
  attributeLeveledUp?: {
    attribute: AttributeType;
    oldLevel: number;
    newLevel: number;
  } | null;
}
