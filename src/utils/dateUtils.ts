/**
 * Timezone and Date Manipulation Utilities
 */

/**
 * Returns the current date in YYYY-MM-DD format for a given IANA timezone.
 * Defaults to client system timezone or UTC if timezone is invalid.
 */
export function getLocalDateString(timezone: string = 'UTC', date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // en-CA gives YYYY-MM-DD
  } catch {
    // Fallback if timezone string is malformed
    const utcYear = date.getUTCFullYear();
    const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(date.getUTCDate()).padStart(2, '0');
    return `${utcYear}-${utcMonth}-${utcDay}`;
  }
}

/**
 * Returns ISO weekday for a YYYY-MM-DD string:
 * 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
 */
export function getIsoWeekday(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const jsDate = new Date(Date.UTC(year, month - 1, day));
  const jsDay = jsDate.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Shifts a YYYY-MM-DD string by deltaDays (+1 or -1 or +N)
 */
export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const jsDate = new Date(Date.UTC(year, month - 1, day));
  jsDate.setUTCDate(jsDate.getUTCDate() + deltaDays);
  const y = jsDate.getUTCFullYear();
  const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jsDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if a date falls on an activity's schedule.
 */
export function isDateScheduled(
  dateStr: string,
  scheduleType: 'daily' | 'weekdays',
  scheduleDays: number[] = [1, 2, 3, 4, 5, 6, 7]
): boolean {
  if (scheduleType === 'daily') {
    return true;
  }
  const isoDay = getIsoWeekday(dateStr);
  return scheduleDays.includes(isoDay);
}

/**
 * Checks if a date falls within an activity's or challenge's valid start/end range.
 */
export function isDateWithinRange(
  dateStr: string,
  startDate: string,
  endDate?: string | null
): boolean {
  if (dateStr < startDate) {
    return false;
  }
  if (endDate && dateStr > endDate) {
    return false;
  }
  return true;
}

/**
 * Finds the previous scheduled date strictly before dateStr.
 */
export function getPreviousScheduledDate(
  dateStr: string,
  scheduleType: 'daily' | 'weekdays',
  scheduleDays: number[],
  startDate: string,
  maxLookbackDays: number = 365
): string | null {
  let current = shiftDateString(dateStr, -1);
  let lookback = 0;
  while (current >= startDate && lookback < maxLookbackDays) {
    if (isDateScheduled(current, scheduleType, scheduleDays)) {
      return current;
    }
    current = shiftDateString(current, -1);
    lookback++;
  }
  return null;
}

/**
 * Finds the next scheduled date strictly after dateStr.
 */
export function getNextScheduledDate(
  dateStr: string,
  scheduleType: 'daily' | 'weekdays',
  scheduleDays: number[],
  endDate?: string | null,
  maxLookaheadDays: number = 365
): string | null {
  let current = shiftDateString(dateStr, 1);
  let lookahead = 0;
  while ((!endDate || current <= endDate) && lookahead < maxLookaheadDays) {
    if (isDateScheduled(current, scheduleType, scheduleDays)) {
      return current;
    }
    current = shiftDateString(current, 1);
    lookahead++;
  }
  return null;
}

/**
 * List of common IANA timezones for selector
 */
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/Madrid',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

export function getUserSystemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
