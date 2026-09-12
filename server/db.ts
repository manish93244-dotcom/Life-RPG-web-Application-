import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Quest, ShopItem, InventoryItem, AttributeType } from '../src/types';
import { calculateXpRequiredForLevel, calculateAttributeXpRequired } from './rpgMath';

export interface StoredUser extends Omit<User, 'xpRequired'> {
  passwordHash: string;
}

export interface DatabaseData {
  users: StoredUser[];
  quests: Quest[];
  items: ShopItem[];
  inventory: InventoryItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'liferpg_db.json');

// Default Armory catalog
export const DEFAULT_ARMORY_ITEMS: ShopItem[] = [
  // Titles
  {
    id: 'title-script-kiddie',
    name: 'Script Kiddie',
    description: 'Fresh on the grid. Ready to compile their first subroutines.',
    category: 'title',
    rarity: 'Common',
    price: 30,
    icon: 'Terminal',
    value: 'Script Kiddie',
  },
  {
    id: 'title-ghost-machine',
    name: 'Ghost in the Machine',
    description: 'Untraceable, elusive, and executes bounties without leaving memory leaks.',
    category: 'title',
    rarity: 'Rare',
    price: 75,
    icon: 'Cpu',
    value: 'Ghost in the Machine',
    statBonus: '+5% Intellect XP',
  },
  {
    id: 'title-cyber-samurai',
    name: 'Cyber Samurai',
    description: 'Disciplined warrior bound by digital bushido. Unstoppable work ethic.',
    category: 'title',
    rarity: 'Epic',
    price: 150,
    icon: 'Sword',
    value: 'Cyber Samurai',
    statBonus: '+10% Strength XP',
  },
  {
    id: 'title-netrunner-prime',
    name: 'Netrunner Prime',
    description: 'Master of deep net architecture and legendary cyberspace bounty hunter.',
    category: 'title',
    rarity: 'Legendary',
    price: 300,
    icon: 'ShieldAlert',
    value: 'Netrunner Prime',
    statBonus: '+15% All XP',
  },

  // Avatars
  {
    id: 'avatar-cyber-runner',
    name: 'Neo Runner',
    description: 'Standard issue tactical street netrunner with augmented HUD visor.',
    category: 'avatar',
    rarity: 'Common',
    price: 0,
    icon: 'Bot',
    value: 'cyber-runner',
  },
  {
    id: 'avatar-neon-samurai',
    name: 'Kenshi Zero',
    description: 'High-frequency blade operative with glowing cyber-kanji motifs.',
    category: 'avatar',
    rarity: 'Rare',
    price: 60,
    icon: 'Swords',
    value: 'neon-samurai',
  },
  {
    id: 'avatar-shadow-operative',
    name: 'Vesper 9',
    description: 'Stealth infiltration agent equipped with optical camouflage fibers.',
    category: 'avatar',
    rarity: 'Epic',
    price: 120,
    icon: 'EyeOff',
    value: 'shadow-operative',
  },
  {
    id: 'avatar-ai-android',
    name: 'Unit Chronos',
    description: 'Sentient synthetic AI shell with crystalline overclocked logic cores.',
    category: 'avatar',
    rarity: 'Legendary',
    price: 250,
    icon: 'CircuitBoard',
    value: 'ai-android',
  },

  // Themes
  {
    id: 'theme-neon-cyan',
    name: 'Cyan Protocol',
    description: 'The standard issue neon cyan cyberpunk visual theme.',
    category: 'theme',
    rarity: 'Common',
    price: 0,
    icon: 'Palette',
    value: 'theme-cyan',
  },
  {
    id: 'theme-hot-magenta',
    name: 'Overdrive Magenta',
    description: 'High-voltage synthwave hot pink and magenta neon accents.',
    category: 'theme',
    rarity: 'Rare',
    price: 50,
    icon: 'Sparkles',
    value: 'theme-magenta',
  },
  {
    id: 'theme-electric-amber',
    name: 'Deus Amber',
    description: 'High-contrast golden amber matrix HUD inspired by golden-age deckers.',
    category: 'theme',
    rarity: 'Epic',
    price: 100,
    icon: 'SunMedium',
    value: 'theme-amber',
  },

  // Cyberware
  {
    id: 'cyber-neural-coprocessor',
    name: 'Neural Coprocessor V2',
    description: 'Direct cortical bus accelerator boosting cognitive throughput.',
    category: 'cyberware',
    rarity: 'Rare',
    price: 80,
    icon: 'Zap',
    value: 'neural-coprocessor',
    statBonus: '+10% Focus & Intellect',
  },
  {
    id: 'cyber-chronometer',
    name: 'Chronometer Synapse',
    description: 'Precision timekeeper keeping daily streaks alive against all odds.',
    category: 'cyberware',
    rarity: 'Epic',
    price: 140,
    icon: 'Hourglass',
    value: 'chronometer-synapse',
    statBonus: '+1 Streak Shield Protection',
  },
  {
    id: 'cyber-subdermal-plating',
    name: 'Titanium Subdermal Grid',
    description: 'Denser cellular reinforcement to shrug off physical and mental fatigue.',
    category: 'cyberware',
    rarity: 'Legendary',
    price: 220,
    icon: 'Shield',
    value: 'subdermal-plating',
    statBonus: '+15% Vitality & Recovery',
  },
];

class Database {
  private data: DatabaseData = {
    users: [],
    quests: [],
    items: DEFAULT_ARMORY_ITEMS,
    inventory: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure catalog items are updated if new ones added
        for (const item of DEFAULT_ARMORY_ITEMS) {
          if (!this.data.items.find(i => i.id === item.id)) {
            this.data.items.push(item);
          }
        }
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize database file:', err);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('cyberrunner123', salt);

    const demoUserId = 'user-demo-netrunner';
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const demoUser: StoredUser = {
      id: demoUserId,
      username: 'Neo_Cipher',
      email: 'neo@netrunner.grid',
      passwordHash: demoPasswordHash,
      avatar: 'cyber-runner',
      title: 'Novice Netrunner',
      theme: 'theme-cyan',
      level: 3,
      xp: 220,
      credits: 145,
      statPoints: 2,
      streak: 4,
      lastActiveDate: yesterday.toISOString().slice(0, 10),
      attributes: {
        intellect: { level: 3, xp: 180, xpRequired: calculateAttributeXpRequired(3) },
        strength: { level: 2, xp: 95, xpRequired: calculateAttributeXpRequired(2) },
        vitality: { level: 2, xp: 110, xpRequired: calculateAttributeXpRequired(2) },
        discipline: { level: 3, xp: 210, xpRequired: calculateAttributeXpRequired(3) },
      },
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const initialQuests: Quest[] = [
      {
        id: 'quest-1',
        userId: demoUserId,
        title: 'Overhaul Neural Matrix (Study Architecture)',
        description: 'Read 2 chapters on distributed systems and optimize data pipeline.',
        attribute: 'intellect',
        difficulty: 'C-Rank',
        xpReward: 35,
        creditReward: 25,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'quest-2',
        userId: demoUserId,
        title: 'Tactical Physical Conditioning',
        description: '45-minute high intensity functional strength training circuit.',
        attribute: 'strength',
        difficulty: 'C-Rank',
        xpReward: 35,
        creditReward: 25,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'quest-3',
        userId: demoUserId,
        title: 'Hydration & Bio-Regulation',
        description: 'Drink 2.5L filtered water and prepare cellular nutrition meal.',
        attribute: 'vitality',
        difficulty: 'F-Rank',
        xpReward: 15,
        creditReward: 10,
        completed: false,
        completedAt: null,
        dueDate: null,
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'quest-4',
        userId: demoUserId,
        title: 'Deep Work Terminal Block (2 hrs Zero Distraction)',
        description: 'Disable comlinks, mute notifications, and ship the core module.',
        attribute: 'discipline',
        difficulty: 'S-Rank',
        xpReward: 100,
        creditReward: 75,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'quest-5',
        userId: demoUserId,
        title: 'Morning Bio-Calibration Routine',
        description: '10 minutes mindful breathing + mobility stretches.',
        attribute: 'vitality',
        difficulty: 'F-Rank',
        xpReward: 15,
        creditReward: 10,
        completed: true,
        completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        dueDate: null,
        createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const starterInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        userId: demoUserId,
        itemId: 'avatar-cyber-runner',
        item: DEFAULT_ARMORY_ITEMS.find(i => i.id === 'avatar-cyber-runner')!,
        equipped: true,
        acquiredAt: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        userId: demoUserId,
        itemId: 'theme-neon-cyan',
        item: DEFAULT_ARMORY_ITEMS.find(i => i.id === 'theme-neon-cyan')!,
        equipped: true,
        acquiredAt: new Date().toISOString(),
      },
      {
        id: 'inv-3',
        userId: demoUserId,
        itemId: 'title-script-kiddie',
        item: DEFAULT_ARMORY_ITEMS.find(i => i.id === 'title-script-kiddie')!,
        equipped: false,
        acquiredAt: new Date().toISOString(),
      },
    ];

    this.data = {
      users: [demoUser],
      quests: initialQuests,
      items: DEFAULT_ARMORY_ITEMS,
      inventory: starterInventory,
    };
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to database file:', err);
    }
  }

  // User Methods
  public findUserById(id: string): User | null {
    const u = this.data.users.find(u => u.id === id);
    if (!u) return null;
    return this.formatUser(u);
  }

  public findUserByEmailOrUsername(identifier: string): StoredUser | null {
    const lower = identifier.toLowerCase().trim();
    return this.data.users.find(
      u => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
    ) || null;
  }

  public formatUser(u: StoredUser): User {
    const xpRequired = calculateXpRequiredForLevel(u.level);
    const { passwordHash, ...safeUser } = u;
    return {
      ...safeUser,
      xpRequired,
    };
  }

  public createUser(user: StoredUser): User {
    this.data.users.push(user);

    // Give starter free items
    const freeItems = this.data.items.filter(i => i.price === 0);
    for (const item of freeItems) {
      this.data.inventory.push({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: user.id,
        itemId: item.id,
        item,
        equipped: true,
        acquiredAt: new Date().toISOString(),
      });
    }

    // Give default starter quests
    const defaultQuests: Quest[] = [
      {
        id: `quest-${Date.now()}-1`,
        userId: user.id,
        title: 'Initialize Neural Link (First Quest)',
        description: 'Review your Life RPG terminal and configure your character build.',
        attribute: 'intellect',
        difficulty: 'F-Rank',
        xpReward: 15,
        creditReward: 10,
        completed: false,
        completedAt: null,
        dueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `quest-${Date.now()}-2`,
        userId: user.id,
        title: 'Physical Calibration (30 min Walk or Workout)',
        description: 'Boost circulatory flow and enhance muscle fiber durability.',
        attribute: 'strength',
        difficulty: 'C-Rank',
        xpReward: 35,
        creditReward: 25,
        completed: false,
        completedAt: null,
        dueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    this.data.quests.push(...defaultQuests);

    this.save();
    return this.formatUser(user);
  }

  public updateUser(id: string, updates: Partial<StoredUser>): User | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
    };
    this.save();
    return this.formatUser(this.data.users[index]);
  }

  // Quest Methods
  public getQuestsByUser(userId: string): Quest[] {
    return this.data.quests
      .filter(q => q.userId === userId)
      .sort((a, b) => {
        // Active first, then by date descending
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  public findQuestById(id: string): Quest | null {
    return this.data.quests.find(q => q.id === id) || null;
  }

  public createQuest(quest: Quest): Quest {
    this.data.quests.push(quest);
    this.save();
    return quest;
  }

  public updateQuest(id: string, updates: Partial<Quest>): Quest | null {
    const index = this.data.quests.findIndex(q => q.id === id);
    if (index === -1) return null;

    this.data.quests[index] = {
      ...this.data.quests[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.quests[index];
  }

  public deleteQuest(id: string): boolean {
    const index = this.data.quests.findIndex(q => q.id === id);
    if (index === -1) return false;

    this.data.quests.splice(index, 1);
    this.save();
    return true;
  }

  // Inventory & Armory Methods
  public getShopItems(): ShopItem[] {
    return this.data.items;
  }

  public getInventoryByUser(userId: string): InventoryItem[] {
    return this.data.inventory.filter(inv => inv.userId === userId);
  }

  public addInventoryItem(userId: string, itemId: string): InventoryItem | null {
    const item = this.data.items.find(i => i.id === itemId);
    if (!item) return null;

    const existing = this.data.inventory.find(inv => inv.userId === userId && inv.itemId === itemId);
    if (existing) return existing;

    const newInv: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      itemId,
      item,
      equipped: false,
      acquiredAt: new Date().toISOString(),
    };

    this.data.inventory.push(newInv);
    this.save();
    return newInv;
  }

  public equipInventoryItem(userId: string, inventoryId: string): { user: User; item: ShopItem } | null {
    const inv = this.data.inventory.find(i => i.id === inventoryId && i.userId === userId);
    if (!inv) return null;

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    const category = inv.item.category;

    // Unequip previous item in this category for this user
    for (const item of this.data.inventory) {
      if (item.userId === userId && item.item.category === category) {
        item.equipped = false;
      }
    }

    inv.equipped = true;

    // Apply to user profile
    if (category === 'title') {
      user.title = inv.item.value;
    } else if (category === 'avatar') {
      user.avatar = inv.item.value;
    } else if (category === 'theme') {
      user.theme = inv.item.value;
    }

    this.save();
    return {
      user: this.formatUser(user),
      item: inv.item,
    };
  }
}

export const db = new Database();
