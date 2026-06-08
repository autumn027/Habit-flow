import { HabitHistory } from '../types';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'count';
  threshold: number;
  badgeType: 'bronze' | 'silver' | 'gold' | 'diamond';
  icon: string; // Emoji character
}

export const MILESTONES: Milestone[] = [
  // Streak Milestones
  {
    id: 'streak_3',
    title: '3-Day Spark',
    description: 'Achieve a 3-day perfect habit streak',
    category: 'streak',
    threshold: 3,
    badgeType: 'bronze',
    icon: '⚡'
  },
  {
    id: 'streak_5',
    title: '5-Day Momentum',
    description: 'Achieve a 5-day perfect habit streak',
    category: 'streak',
    threshold: 5,
    badgeType: 'bronze',
    icon: '🔥'
  },
  {
    id: 'streak_7',
    title: 'Weekly Warrior',
    description: 'Maintain consistency for 1 full week (7 days)',
    category: 'streak',
    threshold: 7,
    badgeType: 'silver',
    icon: '🛡️'
  },
  {
    id: 'streak_28',
    title: 'Habit Architect',
    description: 'Build a solid foundation with a 28-day streak',
    category: 'streak',
    threshold: 28,
    badgeType: 'gold',
    icon: '🏛️'
  },
  {
    id: 'streak_60',
    title: 'Infinite Flow',
    description: 'Reach legend status with a 2-month (60-day) streak',
    category: 'streak',
    threshold: 60,
    badgeType: 'diamond',
    icon: '🔮'
  },
  
  // Total Task Count Milestones
  {
    id: 'count_50',
    title: 'Rookie Builder',
    description: 'Complete a total of 50 tasks across your history',
    category: 'count',
    threshold: 50,
    badgeType: 'bronze',
    icon: '🐣'
  },
  {
    id: 'count_100',
    title: 'Active Devotee',
    description: 'Reach a milestone of 100 total completed tasks',
    category: 'count',
    threshold: 100,
    badgeType: 'silver',
    icon: '🏆'
  },
  {
    id: 'count_200',
    title: 'Habit Champion',
    description: 'Amass 200 completed tasks on your consistency tracker',
    category: 'count',
    threshold: 200,
    badgeType: 'gold',
    icon: '👑'
  },
  {
    id: 'count_500',
    title: 'Grandmaster of Life',
    description: 'Legendary accomplishment of 500 total completed tasks',
    category: 'count',
    threshold: 500,
    badgeType: 'diamond',
    icon: '🎓'
  }
];

export interface AchievementStats {
  totalCompletedCount: number;
  currentStreak: number;
  longestStreak: number;
  unlockedList: string[]; // List of unlocked milestone IDs
}

/**
 * Computes general statistics and milestones unlocked based on history and current tasks setup
 */
export function calculateStatsAndMilestones(history: HabitHistory, totalTasksCount: number): AchievementStats {
  let totalCompletedCount = 0;
  
  // Calculate total completed tasks
  Object.values(history).forEach((completedArray) => {
    totalCompletedCount += (completedArray || []).length;
  });

  // Calculate streaks history
  const sortedDates = Object.keys(history)
    .filter(dateStr => {
      const dayHistory = history[dateStr] || [];
      return totalTasksCount > 0 && dayHistory.length === totalTasksCount;
    })
    .sort(); // Sort chronological

  // Calculate longest streak and current streak
  let currentStreak = 0;
  let longestStreak = 0;

  if (sortedDates.length > 0) {
    // Standard consecutive days calculations
    let tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1].replace(/-/g, '/'));
      const curr = new Date(sortedDates[i].replace(/-/g, '/'));
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }

    // Now calculate active current streak (from today or yesterday backwards)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Formatting timezone strings
    const todayStr = formatDateStr(today);
    const yesterdayStr = formatDateStr(yesterday);
    
    const hasCompletedToday = sortedDates.includes(todayStr);
    const hasCompletedYesterday = sortedDates.includes(yesterdayStr);

    if (hasCompletedToday || hasCompletedYesterday) {
      let runDate = hasCompletedToday ? today : yesterday;
      let checking = true;
      while (checking) {
        const runStr = formatDateStr(runDate);
        if (sortedDates.includes(runStr)) {
          currentStreak++;
          runDate.setDate(runDate.getDate() - 1);
        } else {
          checking = false;
        }
      }
    }
  }

  // Determine unlocked badges list
  const unlockedList: string[] = [];
  MILESTONES.forEach((milestone) => {
    if (milestone.category === 'streak') {
      if (longestStreak >= milestone.threshold) {
        unlockedList.push(milestone.id);
      }
    } else if (milestone.category === 'count') {
      if (totalCompletedCount >= milestone.threshold) {
        unlockedList.push(milestone.id);
      }
    }
  });

  return {
    totalCompletedCount,
    currentStreak,
    longestStreak,
    unlockedList
  };
}

// Internal standard formatter
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
