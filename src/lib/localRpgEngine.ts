import {
  User,
  Quest,
  ShopItem,
  InventoryItem,
  QuestCompletionResult,
  AttributeType,
  QuestDifficulty,
} from '../types';
import {
  calculateXpRequiredForLevel,
  calculateAttributeXpRequired,
  getRewardsForDifficulty,
  evaluateStreak,
} from '../../server/rpgMath';

const STORAGE_KEY_USERS = 'liferpg_local_users';
const STORAGE_KEY_QUESTS = 'liferpg_local_quests';
const STORAGE_KEY_INVENTORY = 'liferpg_local_inventory';
const STORAGE_KEY_SESSION = 'liferpg_local_session_userid';

export const LOCAL_DEFAULT_ITEMS: ShopItem[] = [
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

interface StoredUserRecord extends User {
  passwordPlain: string;
}

function getStoredUsers(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUserRecord[]) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function getStoredQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredQuests(quests: Quest[]) {
  localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(quests));
}

function getStoredInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredInventory(inv: InventoryItem[]) {
  localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inv));
}

function getActiveUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY_SESSION);
}

function setActiveUserId(id: string | null) {
  if (id) {
    localStorage.setItem(STORAGE_KEY_SESSION, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
}

export function initLocalNeuralVault(): void {
  const users = getStoredUsers();
  const demoExists = users.some(u => u.username === 'Neo_Cipher' || u.id === 'demo-neo-cipher');

  if (!demoExists) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const demoUser: StoredUserRecord = {
      id: 'demo-neo-cipher',
      username: 'Neo_Cipher',
      email: 'neo@netrunner.grid',
      passwordPlain: 'demopassword123',
      avatar: 'cyber-runner',
      title: 'Novice Netrunner',
      theme: 'theme-cyan',
      level: 3,
      xp: 220,
      xpRequired: calculateXpRequiredForLevel(3),
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

    users.push(demoUser);
    saveStoredUsers(users);

    // Initial quests
    const quests = getStoredQuests();
    const demoQuests: Quest[] = [
      {
        id: 'demo-quest-1',
        userId: demoUser.id,
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
        id: 'demo-quest-2',
        userId: demoUser.id,
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
        id: 'demo-quest-3',
        userId: demoUser.id,
        title: 'Hydration & Bio-Regulation',
        description: 'Consume 2.5L water and take 5 min eye break every 90 minutes of coding.',
        attribute: 'vitality',
        difficulty: 'F-Rank',
        xpReward: 15,
        creditReward: 10,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-quest-4',
        userId: demoUser.id,
        title: 'BOSS RAID: Ship Production Release',
        description: 'Deploy the full stack web application to production and verify live uptime.',
        attribute: 'discipline',
        difficulty: 'S-Rank',
        xpReward: 100,
        creditReward: 75,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];
    demoQuests.forEach(q => quests.push(q));
    saveStoredQuests(quests);

    // Initial starter inventory
    const inventory = getStoredInventory();
    const starterItems = [
      {
        id: 'inv-init-1',
        userId: demoUser.id,
        itemId: 'avatar-cyber-runner',
        item: LOCAL_DEFAULT_ITEMS.find(i => i.id === 'avatar-cyber-runner')!,
        equipped: true,
        acquiredAt: now.toISOString(),
      },
      {
        id: 'inv-init-2',
        userId: demoUser.id,
        itemId: 'theme-neon-cyan',
        item: LOCAL_DEFAULT_ITEMS.find(i => i.id === 'theme-neon-cyan')!,
        equipped: true,
        acquiredAt: now.toISOString(),
      },
    ];
    starterItems.forEach(i => inventory.push(i));
    saveStoredInventory(inventory);
  }
}

export const localRpgEngine = {
  // Demo Login
  demoLogin: async () => {
    initLocalNeuralVault();
    const users = getStoredUsers();
    let demo = users.find(u => u.username === 'Neo_Cipher');
    if (!demo) {
      initLocalNeuralVault();
      demo = getStoredUsers().find(u => u.username === 'Neo_Cipher')!;
    }
    setActiveUserId(demo.id);
    const { passwordPlain, ...userSafe } = demo;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      token: `local_token_${demo.id}`,
      message: 'Demo neural uplink established. Welcome operative.',
    };
  },

  // Login
  login: async (identifier: string, passwordPlain: string) => {
    initLocalNeuralVault();
    const cleanId = identifier.trim().toLowerCase();
    const users = getStoredUsers();

    const match = users.find(
      u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!match) {
      throw new Error(
        `OPERATIVE_NOT_FOUND: Operative '${identifier}' is not registered on the grid yet.`
      );
    }

    if (match.passwordPlain !== passwordPlain) {
      throw new Error('Access denied: Invalid terminal passphrase.');
    }

    setActiveUserId(match.id);
    const { passwordPlain: _, ...userSafe } = match;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      token: `local_token_${match.id}`,
      message: 'Terminal uplink established. Welcome back, operative.',
    };
  },

  // Register
  register: async (
    username: string,
    email: string,
    passwordPlain: string,
    avatar?: string
  ) => {
    initLocalNeuralVault();
    const users = getStoredUsers();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error(`Operative handle '${cleanUsername}' is already claimed by another netrunner.`);
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Comlink frequency '${cleanEmail}' is already registered on the grid.`);
    }

    const now = new Date();
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const chosenAvatar = avatar || 'cyber-runner';

    const newUser: StoredUserRecord = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      passwordPlain,
      avatar: chosenAvatar,
      title: 'Novice Netrunner',
      theme: 'theme-cyan',
      level: 1,
      xp: 0,
      xpRequired: calculateXpRequiredForLevel(1),
      credits: 50,
      statPoints: 1,
      streak: 1,
      lastActiveDate: now.toISOString().slice(0, 10),
      attributes: {
        intellect: { level: 1, xp: 0, xpRequired: calculateAttributeXpRequired(1) },
        strength: { level: 1, xp: 0, xpRequired: calculateAttributeXpRequired(1) },
        vitality: { level: 1, xp: 0, xpRequired: calculateAttributeXpRequired(1) },
        discipline: { level: 1, xp: 0, xpRequired: calculateAttributeXpRequired(1) },
      },
      createdAt: now.toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    // Starter inventory
    const inventory = getStoredInventory();
    const avatarItem = LOCAL_DEFAULT_ITEMS.find(i => i.value === chosenAvatar) || LOCAL_DEFAULT_ITEMS[4];
    const themeItem = LOCAL_DEFAULT_ITEMS.find(i => i.id === 'theme-neon-cyan')!;

    inventory.push(
      {
        id: `inv-${Date.now()}-1`,
        userId,
        itemId: avatarItem.id,
        item: avatarItem,
        equipped: true,
        acquiredAt: now.toISOString(),
      },
      {
        id: `inv-${Date.now()}-2`,
        userId,
        itemId: themeItem.id,
        item: themeItem,
        equipped: true,
        acquiredAt: now.toISOString(),
      }
    );
    saveStoredInventory(inventory);

    // Initial starter quests
    const quests = getStoredQuests();
    const starterQuests: Quest[] = [
      {
        id: `quest-${Date.now()}-1`,
        userId,
        title: 'Calibrate Cyberware (Setup Workspace)',
        description: 'Organize desktop terminal and prepare daily high-priority objectives.',
        attribute: 'discipline',
        difficulty: 'F-Rank',
        xpReward: 15,
        creditReward: 10,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: `quest-${Date.now()}-2`,
        userId,
        title: 'Neural Matrix Sync (Focus Session)',
        description: 'Complete 2 full Pomodoro cycles (50m total) of deep uninterruptible work.',
        attribute: 'intellect',
        difficulty: 'C-Rank',
        xpReward: 35,
        creditReward: 25,
        completed: false,
        completedAt: null,
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
    starterQuests.forEach(q => quests.push(q));
    saveStoredQuests(quests);

    setActiveUserId(userId);
    const { passwordPlain: _, ...userSafe } = newUser;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(1) },
      token: `local_token_${userId}`,
      message: 'Grid registration successful. Welcome operative.',
    };
  },

  // Get Current Session
  getCurrentSession: async () => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    let current = users.find(u => u.id === userId);

    if (!current) {
      current = users.find(u => u.username === 'Neo_Cipher');
      if (current) {
        setActiveUserId(current.id);
      }
    }

    if (!current) {
      throw new Error('No active neural uplink.');
    }

    const inventory = getStoredInventory().filter(i => i.userId === current.id);
    const { passwordPlain: _, ...userSafe } = current;

    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      inventory,
    };
  },

  logout: async () => {
    setActiveUserId(null);
  },

  // Quests
  getQuests: async () => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const quests = getStoredQuests().filter(q => q.userId === userId);
    return { quests };
  },

  createQuest: async (data: {
    title: string;
    description: string;
    attribute: AttributeType;
    difficulty: QuestDifficulty;
    dueDate?: string | null;
  }) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    if (!userId) throw new Error('Operative not authenticated');

    const rewards = getRewardsForDifficulty(data.difficulty);
    const now = new Date().toISOString();
    const newQuest: Quest = {
      id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: data.title.trim(),
      description: data.description.trim(),
      attribute: data.attribute,
      difficulty: data.difficulty,
      xpReward: rewards.xp,
      creditReward: rewards.credits,
      completed: false,
      completedAt: null,
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    const quests = getStoredQuests();
    quests.unshift(newQuest);
    saveStoredQuests(quests);

    return { quest: newQuest, message: 'Bounty directive compiled successfully.' };
  },

  updateQuest: async (id: string, updates: Partial<Quest>) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const quests = getStoredQuests();
    const idx = quests.findIndex(q => q.id === id && q.userId === userId);
    if (idx === -1) throw new Error('Quest directive not found');

    const updated = {
      ...quests[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    quests[idx] = updated;
    saveStoredQuests(quests);
    return { quest: updated };
  },

  deleteQuest: async (id: string) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    let quests = getStoredQuests();
    quests = quests.filter(q => !(q.id === id && q.userId === userId));
    saveStoredQuests(quests);
    return { message: 'Bounty scrubbed from system.', id };
  },

  completeQuest: async (id: string): Promise<QuestCompletionResult> => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('Operative not found');

    const quests = getStoredQuests();
    const questIdx = quests.findIndex(q => q.id === id && q.userId === userId);
    if (questIdx === -1) throw new Error('Quest directive not found');

    const user = users[userIdx];
    const quest = quests[questIdx];

    if (quest.completed) {
      // Toggle back to active
      quest.completed = false;
      quest.completedAt = null;
      quest.updatedAt = new Date().toISOString();
      quests[questIdx] = quest;
      saveStoredQuests(quests);

      const { passwordPlain: _, ...userSafe } = user;
      return {
        quest,
        user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
        earnedXp: 0,
        earnedCredits: 0,
        leveledUp: false,
        oldLevel: user.level,
        newLevel: user.level,
        streakIncremented: false,
        streakBonusCredits: 0,
        attributeLeveledUp: null,
      };
    }

    // Completing quest
    const earnedXp = quest.xpReward;
    let earnedCredits = quest.creditReward;

    // Streak calculation
    const streakResult = evaluateStreak(user.lastActiveDate, user.streak);
    const newStreak = streakResult.newStreak;
    const streakIncremented = streakResult.incremented;
    const streakBonusCredits = streakResult.bonusCredits;
    earnedCredits += streakBonusCredits;

    // Level progression
    const oldLevel = user.level;
    let newLevel = user.level;
    let currentXp = user.xp + earnedXp;
    let xpReq = calculateXpRequiredForLevel(newLevel);
    let leveledUp = false;
    let newStatPoints = user.statPoints;

    while (currentXp >= xpReq) {
      currentXp -= xpReq;
      newLevel += 1;
      leveledUp = true;
      newStatPoints += 2;
      xpReq = calculateXpRequiredForLevel(newLevel);
    }

    // Attribute progression
    const attrKey = quest.attribute;
    const oldAttr = user.attributes[attrKey];
    const oldAttrLevel = oldAttr.level;
    let newAttrLevel = oldAttr.level;
    let newAttrXp = oldAttr.xp + earnedXp;
    let attrXpReq = calculateAttributeXpRequired(newAttrLevel);
    let attrLeveledUp = false;

    while (newAttrXp >= attrXpReq) {
      newAttrXp -= attrXpReq;
      newAttrLevel += 1;
      attrLeveledUp = true;
      attrXpReq = calculateAttributeXpRequired(newAttrLevel);
    }

    user.level = newLevel;
    user.xp = currentXp;
    user.credits += earnedCredits;
    user.statPoints = newStatPoints;
    user.streak = newStreak;
    user.lastActiveDate = new Date().toISOString().slice(0, 10);
    user.attributes[attrKey] = {
      level: newAttrLevel,
      xp: newAttrXp,
      xpRequired: attrXpReq,
    };

    quest.completed = true;
    quest.completedAt = new Date().toISOString();
    quest.updatedAt = new Date().toISOString();

    users[userIdx] = user;
    saveStoredUsers(users);
    quests[questIdx] = quest;
    saveStoredQuests(quests);

    const { passwordPlain: _, ...userSafe } = user;
    return {
      quest,
      user: { ...userSafe, xpRequired: xpReq },
      earnedXp,
      earnedCredits,
      leveledUp,
      oldLevel,
      newLevel,
      streakIncremented,
      streakBonusCredits,
      attributeLeveledUp: attrLeveledUp
        ? {
            attribute: attrKey,
            oldLevel: oldAttrLevel,
            newLevel: newAttrLevel,
          }
        : null,
    };
  },

  // Armory
  getArmoryCatalog: async () => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const user = users.find(u => u.id === userId);
    const userCredits = user ? user.credits : 0;
    const inventory = getStoredInventory().filter(i => i.userId === userId);

    const catalog = LOCAL_DEFAULT_ITEMS.map(item => {
      const inv = inventory.find(i => i.itemId === item.id);
      return {
        ...item,
        owned: item.price === 0 || !!inv,
        equipped: inv ? inv.equipped : false,
        inventoryId: inv ? inv.id : null,
      };
    });

    return { catalog, userCredits };
  },

  buyItem: async (itemId: string) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('User not found');

    const user = users[userIdx];
    const shopItem = LOCAL_DEFAULT_ITEMS.find(i => i.id === itemId);
    if (!shopItem) throw new Error('Catalog item missing');

    const inventory = getStoredInventory();
    const alreadyOwns = inventory.some(i => i.userId === userId && i.itemId === itemId);
    if (alreadyOwns) throw new Error('Item already acquired in armory');

    if (user.credits < shopItem.price) {
      throw new Error(`Insufficient credits. Requires ${shopItem.price} CR.`);
    }

    user.credits -= shopItem.price;
    users[userIdx] = user;
    saveStoredUsers(users);

    const newInv: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId!,
      itemId,
      item: shopItem,
      equipped: false,
      acquiredAt: new Date().toISOString(),
    };
    inventory.push(newInv);
    saveStoredInventory(inventory);

    const { passwordPlain: _, ...userSafe } = user;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      item: newInv,
      message: `${shopItem.name} successfully requisitioned.`,
    };
  },

  equipItem: async (inventoryId: string) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('User not found');

    const user = users[userIdx];
    const inventory = getStoredInventory();
    const invIdx = inventory.findIndex(i => i.id === inventoryId && i.userId === userId);
    if (invIdx === -1) throw new Error('Item not located in inventory');

    const targetInv = inventory[invIdx];
    const category = targetInv.item.category;

    // Unequip existing items of same category
    inventory.forEach(inv => {
      if (inv.userId === userId && inv.item.category === category) {
        inv.equipped = false;
      }
    });

    targetInv.equipped = true;
    saveStoredInventory(inventory);

    // Apply to user profile
    if (category === 'avatar') {
      user.avatar = targetInv.item.value;
    } else if (category === 'title') {
      user.title = targetInv.item.value;
    } else if (category === 'theme') {
      user.theme = targetInv.item.value;
    }

    users[userIdx] = user;
    saveStoredUsers(users);

    const { passwordPlain: _, ...userSafe } = user;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      item: targetInv.item,
      message: `${targetInv.item.name} neural sync active.`,
    };
  },

  // Character
  allocateStat: async (attribute: AttributeType) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('Operative not found');

    const user = users[userIdx];
    if (user.statPoints <= 0) {
      throw new Error('No unallocated neural stat points available.');
    }

    user.statPoints -= 1;
    const currentStat = user.attributes[attribute];
    let attrXp = currentStat.xp + 60;
    let attrLevel = currentStat.level;
    let attrXpReq = currentStat.xpRequired;

    while (attrXp >= attrXpReq) {
      attrXp -= attrXpReq;
      attrLevel += 1;
      attrXpReq = calculateAttributeXpRequired(attrLevel);
    }

    user.attributes[attribute] = {
      level: attrLevel,
      xp: attrXp,
      xpRequired: attrXpReq,
    };

    users[userIdx] = user;
    saveStoredUsers(users);

    const { passwordPlain: _, ...userSafe } = user;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
      message: `${attribute.toUpperCase()} neural augmentation amplified.`,
    };
  },

  updateProfile: async (data: { title?: string; avatar?: string; theme?: string }) => {
    initLocalNeuralVault();
    const userId = getActiveUserId();
    const users = getStoredUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    if (userIdx === -1) throw new Error('Operative not found');

    const user = users[userIdx];
    if (data.title) user.title = data.title;
    if (data.avatar) user.avatar = data.avatar;
    if (data.theme) user.theme = data.theme;

    users[userIdx] = user;
    saveStoredUsers(users);

    const { passwordPlain: _, ...userSafe } = user;
    return {
      user: { ...userSafe, xpRequired: calculateXpRequiredForLevel(userSafe.level) },
    };
  },
};
