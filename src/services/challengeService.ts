/**
 * Group Challenge Service & Leaderboards
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
import {
  ChallengeStatus,
  GroupChallenge,
  GroupChallengeCheckIn,
  LeaderboardEntry,
  UserProfile,
} from '../types';
import { calculateLeaderboards } from '../utils/leaderboard';
import { validateCheckInDate } from '../utils/streakEngine';
import { getGroupMembers } from './groupService';
import { getUserProfile } from './profileService';

export async function getGroupChallenges(groupId: string): Promise<GroupChallenge[]> {
  const path = 'groupChallenges';
  try {
    const q = query(collection(db, path), where('groupId', '==', groupId));
    const snap = await getDocs(q);
    const challenges = snap.docs.map((d) => d.data() as GroupChallenge);
    return challenges.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getChallenge(challengeId: string): Promise<GroupChallenge | null> {
  const path = `groupChallenges/${challengeId}`;
  try {
    const snap = await getDoc(doc(db, 'groupChallenges', challengeId));
    if (!snap.exists()) return null;
    return snap.data() as GroupChallenge;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createGroupChallenge({
  groupId,
  createdBy,
  title,
  description,
  projectId,
  startDate,
  endDate,
  scheduleType,
  scheduleDays,
  timezone,
}: {
  groupId: string;
  createdBy: string;
  title: string;
  description?: string;
  projectId?: string | null;
  startDate: string;
  endDate?: string | null;
  scheduleType: 'daily' | 'weekdays';
  scheduleDays: number[];
  timezone: string;
}): Promise<GroupChallenge> {
  const challengeId = 'ch_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const path = `groupChallenges/${challengeId}`;
  const now = new Date().toISOString();

  const challenge: GroupChallenge = {
    challengeId,
    groupId,
    createdBy,
    title: title.trim(),
    description: description?.trim() || '',
    projectId: projectId || null,
    startDate,
    endDate: endDate || null,
    scheduleType,
    scheduleDays,
    timezone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'groupChallenges', challengeId), challenge);
    return challenge;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateGroupChallenge(
  challengeId: string,
  updates: Partial<Pick<GroupChallenge, 'title' | 'description' | 'status' | 'endDate'>>
): Promise<void> {
  const path = `groupChallenges/${challengeId}`;
  try {
    await updateDoc(doc(db, 'groupChallenges', challengeId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getChallengeCheckIns(challengeId: string): Promise<GroupChallengeCheckIn[]> {
  const path = 'groupChallengeCheckIns';
  try {
    const q = query(collection(db, path), where('challengeId', '==', challengeId));
    const snap = await getDocs(q);
    const checkIns = snap.docs.map((d) => d.data() as GroupChallengeCheckIn);
    return checkIns.sort((a, b) => b.localDate.localeCompare(a.localDate));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function recordChallengeCheckIn({
  challenge,
  userId,
  localDate,
  memberEligibilityDate,
  note,
}: {
  challenge: GroupChallenge;
  userId: string;
  localDate: string;
  memberEligibilityDate: string;
  note?: string;
}): Promise<GroupChallengeCheckIn> {
  // 1. Fetch user's existing completions for this challenge
  const allCheckIns = await getChallengeCheckIns(challenge.challengeId);
  const userCompletedDates = allCheckIns
    .filter((c) => c.userId === userId)
    .map((c) => c.localDate);

  // 2. Validate check-in date honoring late joiner eligibility
  const validation = validateCheckInDate({
    dateToComplete: localDate,
    scheduleType: challenge.scheduleType,
    scheduleDays: challenge.scheduleDays,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    timezone: challenge.timezone,
    existingCompletedDates: userCompletedDates,
    eligibilityStartDate: memberEligibilityDate,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid challenge completion date');
  }

  // 3. Deterministic check-in ID per user and date
  const checkInId = `gchk_${challenge.challengeId}_${userId}_${localDate}`;
  const path = `groupChallengeCheckIns/${checkInId}`;
  const now = new Date().toISOString();

  const newCheckIn: GroupChallengeCheckIn = {
    checkInId,
    challengeId: challenge.challengeId,
    groupId: challenge.groupId,
    userId,
    localDate,
    completedAt: now,
    note: note?.trim() || '',
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'groupChallengeCheckIns', checkInId), newCheckIn);
    return newCheckIn;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getChallengeLeaderboards(
  challengeId: string
): Promise<{
  streakLeaderboard: LeaderboardEntry[];
  totalDaysLeaderboard: LeaderboardEntry[];
}> {
  const challenge = await getChallenge(challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // 1. Get group members
  const members = await getGroupMembers(challenge.groupId);

  // 2. Get check-ins
  const checkIns = await getChallengeCheckIns(challengeId);

  // Map check-ins by user
  const checkInsByUser = new Map<string, string[]>();
  for (const c of checkIns) {
    const list = checkInsByUser.get(c.userId) || [];
    list.push(c.localDate);
    checkInsByUser.set(c.userId, list);
  }

  // Map user profiles
  const profilesMap = new Map<string, UserProfile>();
  for (const m of members) {
    if (!profilesMap.has(m.userId)) {
      const p = await getUserProfile(m.userId);
      if (p) profilesMap.set(m.userId, p);
    }
  }

  return calculateLeaderboards({
    members,
    profilesMap,
    checkInsByUser,
    scheduleType: challenge.scheduleType,
    scheduleDays: challenge.scheduleDays,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    timezone: challenge.timezone,
  });
}
