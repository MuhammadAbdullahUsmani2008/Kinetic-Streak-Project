/**
 * Pure Streak Engine for Kinetik
 * Strictly enforces provisional current streak, missed day expiry,
 * unscheduled day preservation, and competition ranking.
 */

import { StreakCalculation } from '../types';
import {
  getIsoWeekday,
  getLocalDateString,
  getNextScheduledDate,
  getPreviousScheduledDate,
  isDateScheduled,
  isDateWithinRange,
  shiftDateString,
} from './dateUtils';

export interface StreakEngineParams {
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: number[];
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  timezone?: string;
  completedDates: string[]; // YYYY-MM-DD strings
  referenceDate?: string; // override for deterministic testing or timezone calculation
  eligibilityStartDate?: string; // for late joiners in group challenges
}

/**
 * Validates whether a proposed check-in date can be recorded.
 */
export function validateCheckInDate({
  dateToComplete,
  scheduleType,
  scheduleDays,
  startDate,
  endDate,
  timezone = 'UTC',
  existingCompletedDates,
  eligibilityStartDate,
  referenceDate,
}: {
  dateToComplete: string;
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: number[];
  startDate: string;
  endDate?: string | null;
  timezone?: string;
  existingCompletedDates: string[];
  eligibilityStartDate?: string;
  referenceDate?: string;
}): { valid: boolean; error?: string } {
  const currentLocalDate = referenceDate || getLocalDateString(timezone);

  // 1. Cannot complete future date
  if (dateToComplete > currentLocalDate) {
    return { valid: false, error: 'Cannot mark future dates as complete.' };
  }

  // 2. Cannot complete after end date
  if (endDate && dateToComplete > endDate) {
    return { valid: false, error: `Activity has ended on ${endDate}. No new completions allowed.` };
  }

  // 3. Cannot complete before start date
  const effectiveStart = eligibilityStartDate && eligibilityStartDate > startDate
    ? eligibilityStartDate
    : startDate;

  if (dateToComplete < effectiveStart) {
    return { valid: false, error: `Activity cannot be completed before eligible start date (${effectiveStart}).` };
  }

  // 4. Must be a scheduled date
  if (!isDateScheduled(dateToComplete, scheduleType, scheduleDays)) {
    return { valid: false, error: 'Selected date is not a scheduled day for this activity.' };
  }

  // 5. Duplicate completion check
  if (existingCompletedDates.includes(dateToComplete)) {
    return { valid: false, error: 'This activity has already been completed for this date.' };
  }

  return { valid: true };
}

/**
 * Calculates complete streak statistics including provisional streak,
 * longest streak, and total completed days.
 */
export function calculateStreakStatistics({
  scheduleType,
  scheduleDays,
  startDate,
  endDate = null,
  timezone = 'UTC',
  completedDates,
  referenceDate,
  eligibilityStartDate,
}: StreakEngineParams): StreakCalculation {
  const today = referenceDate || getLocalDateString(timezone);
  const effectiveStart = eligibilityStartDate && eligibilityStartDate > startDate
    ? eligibilityStartDate
    : startDate;

  // Filter completed dates to only valid, eligible, scheduled dates up to today
  const validCompletionsSet = new Set<string>();
  for (const d of completedDates) {
    if (
      d >= effectiveStart &&
      (!endDate || d <= endDate) &&
      d <= today &&
      isDateScheduled(d, scheduleType, scheduleDays)
    ) {
      validCompletionsSet.add(d);
    }
  }

  const totalCompletedDays = validCompletionsSet.size;

  // Last completed date
  let lastCompletedDate: string | null = null;
  if (validCompletionsSet.size > 0) {
    const sortedDates = Array.from(validCompletionsSet).sort();
    lastCompletedDate = sortedDates[sortedDates.length - 1];
  }

  // Check today's status
  const isTodayScheduled =
    today >= effectiveStart &&
    (!endDate || today <= endDate) &&
    isDateScheduled(today, scheduleType, scheduleDays);

  const isCompletedToday = isTodayScheduled && validCompletionsSet.has(today);

  // --- Calculate Current Streak (Provisional Model) ---
  let currentStreak = 0;
  let isProvisional = false;

  if (isCompletedToday) {
    // Today is completed! Count today (1) + consecutive preceding scheduled days
    let count = 1;
    let prev = getPreviousScheduledDate(today, scheduleType, scheduleDays, effectiveStart);
    while (prev && validCompletionsSet.has(prev)) {
      count++;
      prev = getPreviousScheduledDate(prev, scheduleType, scheduleDays, effectiveStart);
    }
    currentStreak = count;
    isProvisional = false;
  } else if (isTodayScheduled) {
    // Today is scheduled, but NOT yet completed.
    // The current day has NOT expired yet! Provisional streak is preserved from yesterday/previous scheduled day
    const prevScheduled = getPreviousScheduledDate(today, scheduleType, scheduleDays, effectiveStart);
    if (prevScheduled && validCompletionsSet.has(prevScheduled)) {
      let count = 1;
      let prev = getPreviousScheduledDate(prevScheduled, scheduleType, scheduleDays, effectiveStart);
      while (prev && validCompletionsSet.has(prev)) {
        count++;
        prev = getPreviousScheduledDate(prev, scheduleType, scheduleDays, effectiveStart);
      }
      currentStreak = count;
      isProvisional = true;
    } else {
      // Previous scheduled day was missed or does not exist
      currentStreak = 0;
      isProvisional = false;
    }
  } else {
    // Today is NOT scheduled (e.g. weekend on weekday schedule)
    // Unscheduled days DO NOT break streaks.
    // Find most recent scheduled date strictly prior to today
    const prevScheduled = getPreviousScheduledDate(today, scheduleType, scheduleDays, effectiveStart);
    if (prevScheduled && validCompletionsSet.has(prevScheduled)) {
      let count = 1;
      let prev = getPreviousScheduledDate(prevScheduled, scheduleType, scheduleDays, effectiveStart);
      while (prev && validCompletionsSet.has(prev)) {
        count++;
        prev = getPreviousScheduledDate(prev, scheduleType, scheduleDays, effectiveStart);
      }
      currentStreak = count;
      isProvisional = false;
    } else {
      currentStreak = 0;
      isProvisional = false;
    }
  }

  // --- Calculate Longest Streak ---
  // Traverse all scheduled dates from effectiveStart to min(today, endDate || today)
  let longestStreak = 0;
  let currentRun = 0;

  // We only need to check dates up to today or endDate
  const scanLimit = endDate && endDate < today ? endDate : today;

  if (effectiveStart <= scanLimit) {
    let scanDate = effectiveStart;
    // Advance to first scheduled date
    while (scanDate <= scanLimit && !isDateScheduled(scanDate, scheduleType, scheduleDays)) {
      scanDate = shiftDateString(scanDate, 1);
    }

    while (scanDate <= scanLimit) {
      if (isDateScheduled(scanDate, scheduleType, scheduleDays)) {
        if (validCompletionsSet.has(scanDate)) {
          currentRun++;
          if (currentRun > longestStreak) {
            longestStreak = currentRun;
          }
        } else {
          // Missed scheduled date!
          if (scanDate < today) {
            // Day has expired and was missed: breaks run
            currentRun = 0;
          } else {
            // scanDate === today and not completed: run does not continue into today, but does not wipe previous
            currentRun = 0;
          }
        }
      }
      scanDate = shiftDateString(scanDate, 1);
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  // Determine next scheduled date
  let nextScheduledDate: string | null = null;
  if (!isCompletedToday && isTodayScheduled) {
    nextScheduledDate = today;
  } else {
    nextScheduledDate = getNextScheduledDate(today, scheduleType, scheduleDays, endDate);
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletedDays,
    lastCompletedDate,
    isCompletedToday,
    isTodayScheduled,
    isProvisional,
    nextScheduledDate,
  };
}
