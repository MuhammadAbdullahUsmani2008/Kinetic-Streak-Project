/**
 * Profile Service
 */
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `profiles/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'profiles', userId));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createOrUpdateProfile(data: {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  timezone: string;
  profileVisibility: 'private' | 'public';
}): Promise<UserProfile> {
  const path = `profiles/${data.userId}`;
  const now = new Date().toISOString();
  try {
    const existing = await getUserProfile(data.userId);
    const profile: UserProfile = {
      userId: data.userId,
      displayName: data.displayName.trim() || 'User',
      avatarUrl: data.avatarUrl || '',
      timezone: data.timezone || 'UTC',
      profileVisibility: data.profileVisibility || 'private',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'profiles', data.userId), profile, { merge: true });
    return profile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
