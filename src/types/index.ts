/**
 * Core Domain Types for Kinetik
 */

export type Visibility = 'private' | 'public';
export type ActivityType = 'habit' | 'task';
export type ActivityStatus = 'active' | 'paused' | 'archived' | 'completed';
export type ScheduleType = 'daily' | 'weekdays';
export type GroupRole = 'owner' | 'member';
export type MembershipStatus = 'active' | 'left';
export type ChallengeStatus = 'active' | 'completed' | 'archived';

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  timezone: string;
  profileVisibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  projectId: string;
  ownerId: string;
  title: string;
  description?: string;
  visibility: Visibility;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  activityId: string;
  ownerId: string;
  projectId?: string | null;
  title: string;
  description?: string;
  activityType: ActivityType;
  scheduleType: ScheduleType;
  scheduleDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  timezone: string; // IANA timezone e.g. "UTC" or "America/New_York"
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  visibility: Visibility;
  status: ActivityStatus;
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  lastCompletedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  checkInId: string;
  activityId: string;
  userId: string;
  localDate: string; // YYYY-MM-DD in activity timezone
  completedAt: string; // ISO UTC string
  note?: string;
  createdAt: string;
}

export interface Group {
  groupId: string;
  ownerId: string;
  name: string;
  description?: string;
  visibility: Visibility;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  membershipId: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  status: MembershipStatus;
  joinedAt: string;
  leftAt?: string | null;
  eligibilityStartDate: string; // YYYY-MM-DD (late joiners cannot claim dates prior to this)
  createdAt: string;
  updatedAt: string;
  // Hydrated for display
  displayName?: string;
  avatarUrl?: string;
}

export interface GroupInvitation {
  invitationId: string;
  groupId: string;
  inviteCode: string;
  tokenHash: string;
  createdBy: string;
  expiresAt?: string | null;
  maxUses?: number | null;
  useCount: number;
  revokedAt?: string | null;
  createdAt: string;
}

export interface GroupChallenge {
  challengeId: string;
  groupId: string;
  createdBy: string;
  title: string;
  description?: string;
  projectId?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  scheduleType: ScheduleType;
  scheduleDays: number[];
  timezone: string; // Fixed challenge timezone
  status: ChallengeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GroupChallengeCheckIn {
  checkInId: string;
  challengeId: string;
  groupId: string;
  userId: string;
  localDate: string; // YYYY-MM-DD in challenge timezone
  completedAt: string; // ISO UTC string
  note?: string;
  createdAt: string;
}

export interface StreakCalculation {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  lastCompletedDate: string | null;
  isCompletedToday: boolean;
  isTodayScheduled: boolean;
  isProvisional: boolean; // true if current streak holds pending today's deadline
  nextScheduledDate: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number; // either current streak or total completed days
  isCompletedToday?: boolean;
  isCurrentUser?: boolean;
  eligibilityStartDate: string;
  lastCompletedDate?: string | null;
}
