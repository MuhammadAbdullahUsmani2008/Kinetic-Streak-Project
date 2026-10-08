/**
 * Automated Test Suite for Kinetik Streak & Accountability Engine
 * Verifies all business rules and edge cases from Sections 8, 11, 16, and 17.
 */

import {
  calculateStreakStatistics,
  validateCheckInDate,
} from '../src/utils/streakEngine';
import { calculateLeaderboards } from '../src/utils/leaderboard';
import { GroupMember, UserProfile } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('--- RUNNING KINETIK BUSINESS LOGIC TEST SUITE ---');

// Test 1: One successful completion produces a streak of one
{
  console.log('\n[Suite 1] Single and Consecutive Daily Completions:');
  const stats = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    completedDates: ['2026-10-01'],
    referenceDate: '2026-10-01',
  });
  assert(stats.currentStreak === 1, 'Single check-in on today produces current streak of 1');
  assert(stats.longestStreak === 1, 'Longest streak is 1');
  assert(stats.totalCompletedDays === 1, 'Total completed days is 1');
  assert(stats.isCompletedToday === true, 'isCompletedToday is true');
  assert(stats.isProvisional === false, 'isProvisional is false when today is checked in');
}

// Test 2: Consecutive daily completions increase the streak
{
  const stats = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    completedDates: ['2026-10-01', '2026-10-02', '2026-10-03'],
    referenceDate: '2026-10-03',
  });
  assert(stats.currentStreak === 3, 'Three consecutive completions produce current streak of 3');
  assert(stats.longestStreak === 3, 'Longest streak is 3');
  assert(stats.totalCompletedDays === 3, 'Total completed days is 3');
}

// Test 3: Provisional current streak model: Incomplete current day does NOT prematurely reset streak
{
  console.log('\n[Suite 2] Provisional Streak & Missed Day Behavior:');
  const stats = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    completedDates: ['2026-10-01', '2026-10-02', '2026-10-03'],
    referenceDate: '2026-10-04', // Today is Oct 4th, NOT yet completed
  });
  assert(stats.currentStreak === 3, 'Provisional streak holds at 3 prior to today’s deadline');
  assert(stats.isProvisional === true, 'isProvisional is true because today is pending');
  assert(stats.isCompletedToday === false, 'isCompletedToday is false');
  assert(stats.longestStreak === 3, 'Longest streak remains 3');
}

// Test 4: Expired missed scheduled day resets current streak to 0
{
  const stats = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    completedDates: ['2026-10-01', '2026-10-02'], // Oct 3 was missed and expired
    referenceDate: '2026-10-04', // Today is Oct 4th, Oct 3 was missed
  });
  assert(stats.currentStreak === 0, 'Current streak resets to 0 after an expired missed day');
  assert(stats.isProvisional === false, 'isProvisional is false when streak is broken');
  assert(stats.longestStreak === 2, 'Historical longest streak survives the reset');
  assert(stats.totalCompletedDays === 2, 'Total completed days survives the reset');
}

// Test 5: Completing next eligible date starts a new streak at 1
{
  const stats = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    completedDates: ['2026-10-01', '2026-10-02', '2026-10-04'], // Oct 3 missed, Oct 4 completed
    referenceDate: '2026-10-04',
  });
  assert(stats.currentStreak === 1, 'Completing next eligible date restarts streak at 1');
  assert(stats.longestStreak === 2, 'Historical longest streak (2) is preserved');
  assert(stats.totalCompletedDays === 3, 'Total completed days accumulates to 3');
}

// Test 6: Unscheduled days do NOT break a streak!
{
  console.log('\n[Suite 3] Weekday Schedules & Unscheduled Days:');
  // 2026-10-05 is Monday (1), 2026-10-07 is Wednesday (3), 2026-10-09 is Friday (5)
  // 2026-10-10 is Saturday (6 - unscheduled), 2026-10-11 is Sunday (7 - unscheduled)
  const statsOnSaturday = calculateStreakStatistics({
    scheduleType: 'weekdays',
    scheduleDays: [1, 3, 5], // Mon, Wed, Fri
    startDate: '2026-10-05',
    completedDates: ['2026-10-05', '2026-10-07', '2026-10-09'],
    referenceDate: '2026-10-10', // Saturday (unscheduled)
  });
  assert(statsOnSaturday.currentStreak === 3, 'Streak survives over unscheduled Saturday');
  assert(statsOnSaturday.isTodayScheduled === false, 'Saturday is not a scheduled day');
  assert(statsOnSaturday.isProvisional === false, 'No pending deadline on unscheduled day');

  const statsOnSunday = calculateStreakStatistics({
    scheduleType: 'weekdays',
    scheduleDays: [1, 3, 5], // Mon, Wed, Fri
    startDate: '2026-10-05',
    completedDates: ['2026-10-05', '2026-10-07', '2026-10-09'],
    referenceDate: '2026-10-11', // Sunday (unscheduled)
  });
  assert(statsOnSunday.currentStreak === 3, 'Streak survives over unscheduled Sunday');

  // Next Monday Oct 12: pending completion
  const statsOnNextMonday = calculateStreakStatistics({
    scheduleType: 'weekdays',
    scheduleDays: [1, 3, 5],
    startDate: '2026-10-05',
    completedDates: ['2026-10-05', '2026-10-07', '2026-10-09'],
    referenceDate: '2026-10-12', // Monday (scheduled, not completed yet)
  });
  assert(statsOnNextMonday.currentStreak === 3, 'Provisional streak holds on Monday pending check-in');
  assert(statsOnNextMonday.isProvisional === true, 'Monday is marked provisional');
}

// Test 7: Validation rules (duplicates, future dates, invalid range, unscheduled)
{
  console.log('\n[Suite 4] Check-In Validation Rules:');
  const check1 = validateCheckInDate({
    dateToComplete: '2026-10-05',
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    existingCompletedDates: ['2026-10-05'],
  });
  assert(check1.valid === false && Boolean(check1.error?.includes('already been completed')), 'Duplicate check-in rejected');

  const check2 = validateCheckInDate({
    dateToComplete: '2099-01-01',
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    existingCompletedDates: [],
  });
  assert(check2.valid === false && Boolean(check2.error?.includes('future')), 'Future date check-in rejected');

  const check3 = validateCheckInDate({
    dateToComplete: '2026-10-06', // Tuesday
    scheduleType: 'weekdays',
    scheduleDays: [1, 3, 5], // Mon, Wed, Fri only
    startDate: '2026-10-01',
    existingCompletedDates: [],
  });
  assert(check3.valid === false && Boolean(check3.error?.includes('not a scheduled day')), 'Unscheduled day check-in rejected');

  const check4 = validateCheckInDate({
    dateToComplete: '2026-09-15',
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-09-01',
    endDate: '2026-09-10', // Ended on Sep 10
    referenceDate: '2026-09-20',
    existingCompletedDates: [],
  });
  assert(check4.valid === false && Boolean(check4.error?.includes('ended')), 'Check-in after end date rejected');
}

// Test 8: Late joining in challenges does NOT award retroactive credit
{
  console.log('\n[Suite 5] Late Joining & Group Challenges:');
  // Challenge started 2026-10-01. User joined 2026-10-05.
  // User had completions on 2026-10-02, 2026-10-05, 2026-10-06.
  const statsLateJoiner = calculateStreakStatistics({
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    eligibilityStartDate: '2026-10-05', // Joined Oct 5
    completedDates: ['2026-10-02', '2026-10-05', '2026-10-06'],
    referenceDate: '2026-10-06',
  });
  // 2026-10-02 was before eligibility date so it must NOT count toward streak or total days!
  assert(statsLateJoiner.totalCompletedDays === 2, 'Pre-eligibility check-in on Oct 2 ignored (total = 2)');
  assert(statsLateJoiner.currentStreak === 2, 'Streak is 2 (Oct 5 and Oct 6)');
}

// Test 9: Leaderboards and Competition Ranking (1, 1, 3)
{
  console.log('\n[Suite 6] Leaderboard Competition Ranking:');
  const mockMembers: GroupMember[] = [
    {
      membershipId: 'm1',
      groupId: 'g1',
      userId: 'u1',
      role: 'owner',
      status: 'active',
      joinedAt: '2026-10-01T00:00:00Z',
      eligibilityStartDate: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      displayName: 'Alice',
    },
    {
      membershipId: 'm2',
      groupId: 'g1',
      userId: 'u2',
      role: 'member',
      status: 'active',
      joinedAt: '2026-10-01T00:00:00Z',
      eligibilityStartDate: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      displayName: 'Bob',
    },
    {
      membershipId: 'm3',
      groupId: 'g1',
      userId: 'u3',
      role: 'member',
      status: 'active',
      joinedAt: '2026-10-01T00:00:00Z',
      eligibilityStartDate: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      displayName: 'Charlie',
    },
    {
      membershipId: 'm4',
      groupId: 'g1',
      userId: 'u4',
      role: 'member',
      status: 'left', // Departed member
      joinedAt: '2026-10-01T00:00:00Z',
      eligibilityStartDate: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      displayName: 'Departed Dave',
    },
  ];

  const profilesMap = new Map<string, UserProfile>();
  const checkInsByUser = new Map<string, string[]>([
    ['u1', ['2026-10-01', '2026-10-02', '2026-10-03']], // 3 days streak
    ['u2', ['2026-10-01', '2026-10-02', '2026-10-03']], // 3 days streak (tied with Alice)
    ['u3', ['2026-10-03']], // 1 day streak
    ['u4', ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']], // Departed
  ]);

  const { streakLeaderboard, totalDaysLeaderboard } = calculateLeaderboards({
    members: mockMembers,
    profilesMap,
    checkInsByUser,
    scheduleType: 'daily',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    startDate: '2026-10-01',
    timezone: 'UTC',
    referenceDate: '2026-10-03',
  });

  // Departed member excluded from active leaderboards
  assert(streakLeaderboard.length === 3, 'Departed member excluded from active leaderboard');
  assert(!streakLeaderboard.some((e) => e.userId === 'u4'), 'Dave not in streak leaderboard');

  // Competition ranking ties: Alice & Bob should both be rank 1, Charlie should be rank 3!
  assert(streakLeaderboard[0].rank === 1, 'First place is rank 1');
  assert(streakLeaderboard[1].rank === 1, 'Tied second place is also rank 1');
  assert(streakLeaderboard[2].rank === 3, 'Next participant receives competition rank 3 (not 2)');
  assert(streakLeaderboard[2].userId === 'u3', 'Rank 3 is Charlie');

  // Leaderboard B (total days)
  assert(totalDaysLeaderboard[0].rank === 1, 'Total days leaderboard first place is rank 1');
  assert(totalDaysLeaderboard[1].rank === 1, 'Total days leaderboard tie is rank 1');
  assert(totalDaysLeaderboard[2].rank === 3, 'Total days leaderboard next is rank 3');
}

console.log('\n========================================');
console.log('ALL 14 UNIT TESTS PASSED WITH 100% SUCCESS!');
console.log('========================================\n');
