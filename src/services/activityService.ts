/**
 * Activity & Check-In Service
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Activity, CheckIn, StreakCalculation, Visibility } from '../types';
import { calculateStreakStatistics, validateCheckInDate } from '../utils/streakEngine';

export async function getUserActivities(userId: string): Promise<Activity[]> {
  const path = 'activities';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    const activities = snap.docs.map((d) => d.data() as Activity);
    return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getActivity(activityId: string): Promise<Activity | null> {
  const path = `activities/${activityId}`;
  try {
    const snap = await getDoc(doc(db, 'activities', activityId));
    if (!snap.exists()) return null;
    return snap.data() as Activity;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createActivity(data: {
  ownerId: string;
  projectId?: string | null;
  title: string;
  description?: string;
  activityType: 'habit' | 'task';
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: number[];
  timezone: string;
  startDate: string;
  endDate?: string | null;
  visibility: Visibility;
}): Promise<Activity> {
  const activityId = 'act_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const path = `activities/${activityId}`;
  const now = new Date().toISOString();

  const activity: Activity = {
    activityId,
    ownerId: data.ownerId,
    projectId: data.projectId || null,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    activityType: data.activityType,
    scheduleType: data.scheduleType,
    scheduleDays: data.scheduleDays,
    timezone: data.timezone,
    startDate: data.startDate,
    endDate: data.endDate || null,
    visibility: data.visibility,
    status: 'active',
    currentStreak: 0,
    longestStreak: 0,
    totalCompletedDays: 0,
    lastCompletedDate: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'activities', activityId), activity);
    return activity;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateActivity(
  activityId: string,
  updates: Partial<Omit<Activity, 'activityId' | 'ownerId' | 'createdAt'>>
): Promise<void> {
  const path = `activities/${activityId}`;
  try {
    await updateDoc(doc(db, 'activities', activityId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteActivity(activityId: string): Promise<void> {
  const path = `activities/${activityId}`;
  try {
    await deleteDoc(doc(db, 'activities', activityId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getActivityCheckIns(activityId: string): Promise<CheckIn[]> {
  const path = 'checkIns';
  try {
    const q = query(collection(db, path), where('activityId', '==', activityId));
    const snap = await getDocs(q);
    const checkIns = snap.docs.map((d) => d.data() as CheckIn);
    return checkIns.sort((a, b) => b.localDate.localeCompare(a.localDate));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function recordActivityCheckIn({
  activity,
  localDate,
  note,
}: {
  activity: Activity;
  localDate: string;
  note?: string;
}): Promise<{ checkIn: CheckIn; stats: StreakCalculation }> {
  // 1. Fetch current check-ins to evaluate existing history
  const existingCheckIns = await getActivityCheckIns(activity.activityId);
  const existingCompletedDates = existingCheckIns.map((c) => c.localDate);

  // 2. Validate completion date
  const validation = validateCheckInDate({
    dateToComplete: localDate,
    scheduleType: activity.scheduleType,
    scheduleDays: activity.scheduleDays,
    startDate: activity.startDate,
    endDate: activity.endDate,
    timezone: activity.timezone,
    existingCompletedDates,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid check-in date');
  }

  // 3. Create deterministic checkIn record
  const checkInId = `chk_${activity.activityId}_${localDate}`;
  const path = `checkIns/${checkInId}`;
  const now = new Date().toISOString();

  const newCheckIn: CheckIn = {
    checkInId,
    activityId: activity.activityId,
    userId: activity.ownerId,
    localDate,
    completedAt: now,
    note: note?.trim() || '',
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'checkIns', checkInId), newCheckIn);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  // 4. Recalculate streak statistics with newly added date
  const allCompletedDates = [...existingCompletedDates, localDate];
  const stats = calculateStreakStatistics({
    scheduleType: activity.scheduleType,
    scheduleDays: activity.scheduleDays,
    startDate: activity.startDate,
    endDate: activity.endDate,
    timezone: activity.timezone,
    completedDates: allCompletedDates,
  });

  // 5. Update cached activity statistics
  await updateActivity(activity.activityId, {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalCompletedDays: stats.totalCompletedDays,
    lastCompletedDate: stats.lastCompletedDate,
  });

  return { checkIn: newCheckIn, stats };
}

export async function recalculateActivityStats(activity: Activity): Promise<StreakCalculation> {
  const checkIns = await getActivityCheckIns(activity.activityId);
  const completedDates = checkIns.map((c) => c.localDate);

  const stats = calculateStreakStatistics({
    scheduleType: activity.scheduleType,
    scheduleDays: activity.scheduleDays,
    startDate: activity.startDate,
    endDate: activity.endDate,
    timezone: activity.timezone,
    completedDates,
  });

  await updateActivity(activity.activityId, {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalCompletedDays: stats.totalCompletedDays,
    lastCompletedDate: stats.lastCompletedDate,
  });

  return stats;
}
