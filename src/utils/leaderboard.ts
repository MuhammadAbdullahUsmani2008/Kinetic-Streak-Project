/**
 * Leaderboard Engine with Competition Ranking (1, 1, 3)
 */

import { GroupMember, LeaderboardEntry, UserProfile } from '../types';
import { calculateStreakStatistics } from './streakEngine';

export interface ParticipantCheckInSummary {
  userId: string;
  eligibilityStartDate: string;
  completedDates: string[]; // dates recorded for this challenge
  displayName?: string;
  avatarUrl?: string;
}

export interface CalculateLeaderboardsParams {
  members: GroupMember[];
  profilesMap: Map<string, UserProfile>;
  checkInsByUser: Map<string, string[]>; // userId -> array of YYYY-MM-DD
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: number[];
  startDate: string;
  endDate?: string | null;
  timezone: string;
  referenceDate?: string;
}

export function calculateLeaderboards({
  members,
  profilesMap,
  checkInsByUser,
  scheduleType,
  scheduleDays,
  startDate,
  endDate,
  timezone,
  referenceDate,
}: CalculateLeaderboardsParams): {
  streakLeaderboard: LeaderboardEntry[];
  totalDaysLeaderboard: LeaderboardEntry[];
} {
  // Only active members appear in active rankings
  const activeMembers = members.filter((m) => m.status === 'active');

  const rawEntries: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    currentStreak: number;
    totalCompletedDays: number;
    isCompletedToday: boolean;
    eligibilityStartDate: string;
    lastCompletedDate: string | null;
  }[] = [];

  for (const member of activeMembers) {
    const profile = profilesMap.get(member.userId);
    const displayName = member.displayName || profile?.displayName || 'Anonymous Participant';
    const avatarUrl = member.avatarUrl || profile?.avatarUrl;

    const userCompletedDates = checkInsByUser.get(member.userId) || [];

    // Calculate streak stats honoring member's eligibilityStartDate (late joining rule)
    const stats = calculateStreakStatistics({
      scheduleType,
      scheduleDays,
      startDate,
      endDate,
      timezone,
      completedDates: userCompletedDates,
      referenceDate,
      eligibilityStartDate: member.eligibilityStartDate,
    });

    rawEntries.push({
      userId: member.userId,
      displayName,
      avatarUrl,
      currentStreak: stats.currentStreak,
      totalCompletedDays: stats.totalCompletedDays,
      isCompletedToday: stats.isCompletedToday,
      eligibilityStartDate: member.eligibilityStartDate,
      lastCompletedDate: stats.lastCompletedDate,
    });
  }

  // --- 1. Compute Leaderboard A: Current Streak with Standard Competition Ranking (1, 1, 3) ---
  const streakSorted = [...rawEntries].sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    // Stable secondary: total completed days, then display name
    if (b.totalCompletedDays !== a.totalCompletedDays) {
      return b.totalCompletedDays - a.totalCompletedDays;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const streakLeaderboard: LeaderboardEntry[] = [];
  let currentRank = 1;

  for (let i = 0; i < streakSorted.length; i++) {
    const item = streakSorted[i];
    if (i > 0 && item.currentStreak === streakSorted[i - 1].currentStreak) {
      // Tie shares previous rank
      // currentRank stays the same
    } else {
      currentRank = i + 1; // Competition rank jump
    }

    streakLeaderboard.push({
      rank: currentRank,
      userId: item.userId,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      score: item.currentStreak,
      isCompletedToday: item.isCompletedToday,
      eligibilityStartDate: item.eligibilityStartDate,
      lastCompletedDate: item.lastCompletedDate,
    });
  }

  // --- 2. Compute Leaderboard B: Total Completed Days with Standard Competition Ranking (1, 1, 3) ---
  const totalDaysSorted = [...rawEntries].sort((a, b) => {
    if (b.totalCompletedDays !== a.totalCompletedDays) {
      return b.totalCompletedDays - a.totalCompletedDays;
    }
    // Stable secondary: current streak, then display name
    if (b.currentStreak !== a.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  const totalDaysLeaderboard: LeaderboardEntry[] = [];
  let daysRank = 1;

  for (let i = 0; i < totalDaysSorted.length; i++) {
    const item = totalDaysSorted[i];
    if (i > 0 && item.totalCompletedDays === totalDaysSorted[i - 1].totalCompletedDays) {
      // Tie shares previous rank
    } else {
      daysRank = i + 1;
    }

    totalDaysLeaderboard.push({
      rank: daysRank,
      userId: item.userId,
      displayName: item.displayName,
      avatarUrl: item.avatarUrl,
      score: item.totalCompletedDays,
      isCompletedToday: item.isCompletedToday,
      eligibilityStartDate: item.eligibilityStartDate,
      lastCompletedDate: item.lastCompletedDate,
    });
  }

  return { streakLeaderboard, totalDaysLeaderboard };
}
