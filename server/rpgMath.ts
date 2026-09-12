import { AttributeType, QuestDifficulty } from '../src/types';

/**
 * Non-linear Level Math:
 * Formula: XP_required = Math.floor(100 * Math.pow(level, 1.5))
 */
export function calculateXpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Attribute Level Math:
 * Formula: XP_required = Math.floor(60 * Math.pow(attrLevel, 1.4))
 */
export function calculateAttributeXpRequired(level: number): number {
  return Math.floor(60 * Math.pow(level, 1.4));
}

/**
 * Quest rewards by difficulty rank
 * F-Rank (Easy): 15 XP, 10 Credits
 * C-Rank (Medium): 35 XP, 25 Credits
 * S-Rank (Boss/Hard): 100 XP, 75 Credits
 */
export function getRewardsForDifficulty(difficulty: QuestDifficulty): { xp: number; credits: number } {
  switch (difficulty) {
    case 'F-Rank':
      return { xp: 15, credits: 10 };
    case 'C-Rank':
      return { xp: 35, credits: 25 };
    case 'S-Rank':
      return { xp: 100, credits: 75 };
    default:
      return { xp: 20, credits: 15 };
  }
}

/**
 * Streak evaluation logic
 * Compares current date with last active date (in YYYY-MM-DD format)
 */
export function evaluateStreak(lastActiveDateStr: string | null, currentStreak: number): {
  newStreak: number;
  incremented: boolean;
  bonusCredits: number;
} {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (!lastActiveDateStr) {
    return {
      newStreak: 1,
      incremented: true,
      bonusCredits: 10,
    };
  }

  const lastDate = new Date(lastActiveDateStr);
  const today = new Date(todayStr);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already active today
    return {
      newStreak: Math.max(1, currentStreak),
      incremented: false,
      bonusCredits: 0,
    };
  } else if (diffDays === 1) {
    // Consecutive active day!
    const newStreak = currentStreak + 1;
    const bonusCredits = Math.min(newStreak * 5, 50); // Daily streak bonus scaling up to 50 CR
    return {
      newStreak,
      incremented: true,
      bonusCredits,
    };
  } else {
    // Streak broken (> 1 day missed)
    return {
      newStreak: 1,
      incremented: true,
      bonusCredits: 5,
    };
  }
}
