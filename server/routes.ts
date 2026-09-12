import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { generateToken, requireAuth, AuthenticatedRequest } from './auth';
import {
  calculateXpRequiredForLevel,
  calculateAttributeXpRequired,
  getRewardsForDifficulty,
  evaluateStreak,
} from './rpgMath';
import { Quest, QuestDifficulty, AttributeType } from '../src/types';

export const apiRouter = Router();

// ==========================================
// AUTHENTICATION & SESSION ROUTES
// ==========================================

/**
 * POST /api/auth/register
 */
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Operative username, email, and security passphrase are required.' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Passphrase must be at least 6 characters for terminal clearance.' });
      return;
    }

    const existingUser = db.findUserByEmailOrUsername(email) || db.findUserByEmailOrUsername(username);
    if (existingUser) {
      res.status(409).json({ error: 'Operative with this codename or email already registered on the grid.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const now = new Date();
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newUser = db.createUser({
      id: userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatar: avatar || 'cyber-runner',
      title: 'Novice Netrunner',
      theme: 'theme-cyan',
      level: 1,
      xp: 0,
      credits: 50, // Starting bonus
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
    });

    const token = generateToken(newUser);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: newUser,
      token,
      message: 'Grid registration successful. Welcome operative.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal system error during registration: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 */
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Operative identifier and passphrase are required.' });
      return;
    }

    const stored = db.findUserByEmailOrUsername(identifier);
    if (!stored) {
      res.status(401).json({ error: 'Invalid codename or passphrase. Terminal access denied.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, stored.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid codename or passphrase. Terminal access denied.' });
      return;
    }

    const user = db.formatUser(stored);
    const token = generateToken(user);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user,
      token,
      message: 'Terminal uplink established. Welcome back, operative.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login authentication error: ' + err.message });
  }
});

/**
 * POST /api/auth/demo
 * Instant 1-click test login as the demo Netrunner
 */
apiRouter.post('/auth/demo', (_req, res) => {
  try {
    const demoUser = db.findUserByEmailOrUsername('Neo_Cipher');
    if (!demoUser) {
      res.status(404).json({ error: 'Demo operative profile missing.' });
      return;
    }

    const user = db.formatUser(demoUser);
    const token = generateToken(user);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user,
      token,
      message: 'Demo neural uplink granted.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Demo login failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 */
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const inventory = db.getInventoryByUser(user.id);
  res.json({ user, inventory });
});

/**
 * POST /api/auth/logout
 */
apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Neural terminal disconnected successfully.' });
});

// ==========================================
// CHARACTER & ATTRIBUTE STATS
// ==========================================

/**
 * POST /api/character/allocate-stat
 * Spend earned stat points to upgrade attributes
 */
apiRouter.post('/character/allocate-stat', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { attribute } = req.body as { attribute: AttributeType };

    if (!attribute || !user.attributes[attribute]) {
      res.status(400).json({ error: 'Invalid attribute target.' });
      return;
    }

    if (user.statPoints <= 0) {
      res.status(400).json({ error: 'Insufficient unallocated stat points.' });
      return;
    }

    const currentAttr = user.attributes[attribute];
    const newLevel = currentAttr.level + 1;
    const newXpRequired = calculateAttributeXpRequired(newLevel);

    const updatedUser = db.updateUser(user.id, {
      statPoints: user.statPoints - 1,
      attributes: {
        ...user.attributes,
        [attribute]: {
          level: newLevel,
          xp: currentAttr.xp,
          xpRequired: newXpRequired,
        },
      },
    });

    res.json({
      user: updatedUser,
      message: `Successfully enhanced ${attribute.toUpperCase()} to Level ${newLevel}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to allocate stat point: ' + err.message });
  }
});

/**
 * PATCH /api/character/profile
 */
apiRouter.patch('/api/character/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, avatar, theme } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (avatar) updates.avatar = avatar;
    if (theme) updates.theme = theme;

    const updatedUser = db.updateUser(user.id, updates);
    res.json({ user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Profile update failed: ' + err.message });
  }
});

// ==========================================
// QUEST / BOUNTY CRUD & COMPLETION
// ==========================================

/**
 * GET /api/quests
 */
apiRouter.get('/quests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const quests = db.getQuestsByUser(userId);
    res.json({ quests });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch quests: ' + err.message });
  }
});

/**
 * POST /api/quests
 */
apiRouter.post('/quests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, attribute, difficulty, dueDate } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Quest directive / title is required.' });
      return;
    }

    const validAttributes: AttributeType[] = ['intellect', 'strength', 'vitality', 'discipline'];
    const targetAttribute: AttributeType = validAttributes.includes(attribute) ? attribute : 'intellect';

    const validDifficulties: QuestDifficulty[] = ['F-Rank', 'C-Rank', 'S-Rank'];
    const targetDifficulty: QuestDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'C-Rank';

    const rewards = getRewardsForDifficulty(targetDifficulty);

    const now = new Date();
    const newQuest: Quest = {
      id: `quest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: title.trim(),
      description: (description || '').trim(),
      attribute: targetAttribute,
      difficulty: targetDifficulty,
      xpReward: rewards.xp,
      creditReward: rewards.credits,
      completed: false,
      completedAt: null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const savedQuest = db.createQuest(newQuest);
    res.status(201).json({ quest: savedQuest, message: 'New bounty published to terminal.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create quest: ' + err.message });
  }
});

/**
 * PATCH /api/quests/:id
 */
apiRouter.patch('/quests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const questId = req.params.id;

    const quest = db.findQuestById(questId);
    if (!quest || quest.userId !== userId) {
      res.status(404).json({ error: 'Bounty directive not found or access denied.' });
      return;
    }

    const { title, description, attribute, difficulty, dueDate } = req.body;
    const updates: Partial<Quest> = {};

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate).toISOString() : null;

    if (difficulty && ['F-Rank', 'C-Rank', 'S-Rank'].includes(difficulty)) {
      updates.difficulty = difficulty;
      const rewards = getRewardsForDifficulty(difficulty);
      updates.xpReward = rewards.xp;
      updates.creditReward = rewards.credits;
    }

    if (attribute && ['intellect', 'strength', 'vitality', 'discipline'].includes(attribute)) {
      updates.attribute = attribute;
    }

    const updated = db.updateQuest(questId, updates);
    res.json({ quest: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update quest: ' + err.message });
  }
});

/**
 * DELETE /api/quests/:id
 */
apiRouter.delete('/quests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const questId = req.params.id;

    const quest = db.findQuestById(questId);
    if (!quest || quest.userId !== userId) {
      res.status(404).json({ error: 'Bounty directive not found or access denied.' });
      return;
    }

    db.deleteQuest(questId);
    res.json({ message: 'Bounty purged from database.', id: questId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete quest: ' + err.message });
  }
});

/**
 * POST /api/quests/:id/complete
 * SECURE SERVER-SIDE CALCULATION ENGINE
 * Evaluates Level up, Leftover XP, Attribute Progression, Streaks, Credits
 */
apiRouter.post('/quests/:id/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const questId = req.params.id;

    const quest = db.findQuestById(questId);
    if (!quest || quest.userId !== userId) {
      res.status(404).json({ error: 'Bounty directive not found.' });
      return;
    }

    // Toggle logic: If already completed, allow uncompleting
    if (quest.completed) {
      const updatedQuest = db.updateQuest(questId, {
        completed: false,
        completedAt: null,
      });
      res.json({
        quest: updatedQuest,
        user: req.user!,
        earnedXp: 0,
        earnedCredits: 0,
        leveledUp: false,
        oldLevel: req.user!.level,
        newLevel: req.user!.level,
        streakIncremented: false,
        streakBonusCredits: 0,
        message: 'Quest reactivated on the board.',
      });
      return;
    }

    // Server-side calculation
    const user = req.user!;
    const earnedXp = quest.xpReward;
    let earnedCredits = quest.creditReward;

    // 1. Streak Evaluation
    const streakResult = evaluateStreak(user.lastActiveDate, user.streak);
    const newStreak = streakResult.newStreak;
    const streakBonusCredits = streakResult.bonusCredits;
    earnedCredits += streakBonusCredits;

    const todayStr = new Date().toISOString().slice(0, 10);

    // 2. Character XP and Non-linear Level-up calculation
    // Formula: XP_required = Math.floor(100 * Math.pow(level, 1.5))
    let currentXp = user.xp + earnedXp;
    let currentLevel = user.level;
    let statPointsGained = 0;
    const oldLevel = user.level;
    let leveledUp = false;

    let xpNeeded = calculateXpRequiredForLevel(currentLevel);
    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      currentLevel += 1;
      statPointsGained += 2; // Award 2 stat points per level
      leveledUp = true;
      xpNeeded = calculateXpRequiredForLevel(currentLevel);
    }

    // 3. Attribute Breakdown Progression
    // Tasks tagged with Intellect grant Intellect XP, etc.
    const attrType = quest.attribute;
    const currentAttr = user.attributes[attrType] || {
      level: 1,
      xp: 0,
      xpRequired: calculateAttributeXpRequired(1),
    };

    let attrXp = currentAttr.xp + earnedXp;
    let attrLevel = currentAttr.level;
    let attrXpNeeded = calculateAttributeXpRequired(attrLevel);
    let attributeLeveledUpInfo = null;

    if (attrXp >= attrXpNeeded) {
      const oldAttrLevel = attrLevel;
      while (attrXp >= attrXpNeeded) {
        attrXp -= attrXpNeeded;
        attrLevel += 1;
        attrXpNeeded = calculateAttributeXpRequired(attrLevel);
      }
      attributeLeveledUpInfo = {
        attribute: attrType,
        oldLevel: oldAttrLevel,
        newLevel: attrLevel,
      };
    }

    const updatedAttributes = {
      ...user.attributes,
      [attrType]: {
        level: attrLevel,
        xp: attrXp,
        xpRequired: attrXpNeeded,
      },
    };

    // 4. Update Quest state
    const updatedQuest = db.updateQuest(questId, {
      completed: true,
      completedAt: new Date().toISOString(),
    })!;

    // 5. Update User State
    const updatedUser = db.updateUser(user.id, {
      level: currentLevel,
      xp: currentXp,
      credits: user.credits + earnedCredits,
      statPoints: user.statPoints + statPointsGained,
      streak: newStreak,
      lastActiveDate: todayStr,
      attributes: updatedAttributes,
    })!;

    res.json({
      quest: updatedQuest,
      user: updatedUser,
      earnedXp,
      earnedCredits,
      leveledUp,
      oldLevel,
      newLevel: currentLevel,
      streakIncremented: streakResult.incremented,
      streakBonusCredits,
      attributeLeveledUp: attributeLeveledUpInfo,
      message: leveledUp
        ? `LEVEL UP! Cleared Rank ${currentLevel} with +${earnedXp} XP and +${earnedCredits} CR!`
        : `Bounty completed! +${earnedXp} XP, +${earnedCredits} CR credited to account.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server quest calculation error: ' + err.message });
  }
});

// ==========================================
// GAMIFIED ECONOMY / CYBER ARMORY
// ==========================================

/**
 * GET /api/armory/items
 */
apiRouter.get('/armory/items', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = db.getShopItems();
    const inventory = db.getInventoryByUser(userId);

    const inventoryMap = new Map<string, { inventoryId: string; equipped: boolean }>();
    for (const inv of inventory) {
      inventoryMap.set(inv.itemId, { inventoryId: inv.id, equipped: inv.equipped });
    }

    const catalog = items.map(item => {
      const ownedInfo = inventoryMap.get(item.id);
      return {
        ...item,
        owned: !!ownedInfo,
        equipped: ownedInfo ? ownedInfo.equipped : false,
        inventoryId: ownedInfo ? ownedInfo.inventoryId : null,
      };
    });

    res.json({ catalog, userCredits: req.user!.credits });
  } catch (err: any) {
    res.status(500).json({ error: 'Armory catalog query failed: ' + err.message });
  }
});

/**
 * POST /api/armory/buy
 */
apiRouter.post('/armory/buy', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({ error: 'Item identifier required for acquisition.' });
      return;
    }

    const items = db.getShopItems();
    const targetItem = items.find(i => i.id === itemId);
    if (!targetItem) {
      res.status(404).json({ error: 'Hardware or firmware item not found in Armory.' });
      return;
    }

    const user = req.user!;
    const inventory = db.getInventoryByUser(userId);
    const alreadyOwned = inventory.some(inv => inv.itemId === itemId);
    if (alreadyOwned) {
      res.status(400).json({ error: 'Hardware already registered in user inventory.' });
      return;
    }

    if (user.credits < targetItem.price) {
      res.status(400).json({
        error: `Insufficient Credits (CR). Required: ${targetItem.price} CR, Available: ${user.credits} CR.`,
      });
      return;
    }

    // Deduct credits and award item
    const updatedUser = db.updateUser(userId, {
      credits: user.credits - targetItem.price,
    })!;

    const newInventoryItem = db.addInventoryItem(userId, itemId)!;

    res.status(201).json({
      user: updatedUser,
      item: newInventoryItem,
      message: `Purchased [${targetItem.name}] for ${targetItem.price} CR!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Transaction failed: ' + err.message });
  }
});

/**
 * POST /api/armory/equip
 */
apiRouter.post('/armory/equip', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { inventoryId } = req.body;

    if (!inventoryId) {
      res.status(400).json({ error: 'Inventory identifier required.' });
      return;
    }

    const result = db.equipInventoryItem(userId, inventoryId);
    if (!result) {
      res.status(404).json({ error: 'Item not found in user inventory.' });
      return;
    }

    res.json({
      user: result.user,
      item: result.item,
      message: `Equipped [${result.item.name}] to operative profile.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Equip operation failed: ' + err.message });
  }
});
