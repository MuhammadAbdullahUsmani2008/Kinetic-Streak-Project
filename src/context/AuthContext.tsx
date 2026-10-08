/**
 * Authentication Context & Provider
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';
import { UserProfile } from '../types';
import { createOrUpdateProfile, getUserProfile } from '../services/profileService';
import { getUserSystemTimezone } from '../utils/dateUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string, timezone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; avatarUrl?: string; timezone?: string; profileVisibility?: 'private' | 'public' }) => Promise<void>;
  completeOnboarding: (displayName: string, timezone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Initialize and listen to auth state changes
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await getUserProfile(currentUser.uid);
          if (userProfile) {
            setProfile(userProfile);
            setNeedsOnboarding(!userProfile.displayName || !userProfile.timezone);
          } else {
            // First time user: initialize draft profile
            const systemTz = getUserSystemTimezone();
            const initialProfile = await createOrUpdateProfile({
              userId: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              avatarUrl: currentUser.photoURL || '',
              timezone: systemTz,
              profileVisibility: 'private',
            });
            setProfile(initialProfile);
            setNeedsOnboarding(true);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setProfile(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string, timezone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await fbUpdateProfile(cred.user, { displayName });

    const tz = timezone || getUserSystemTimezone();
    const newProfile = await createOrUpdateProfile({
      userId: cred.user.uid,
      displayName: displayName.trim(),
      timezone: tz,
      profileVisibility: 'private',
    });
    setProfile(newProfile);
    setNeedsOnboarding(false);
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await getUserProfile(cred.user.uid);
    if (!existing) {
      const tz = getUserSystemTimezone();
      const newProfile = await createOrUpdateProfile({
        userId: cred.user.uid,
        displayName: cred.user.displayName || 'User',
        avatarUrl: cred.user.photoURL || '',
        timezone: tz,
        profileVisibility: 'private',
      });
      setProfile(newProfile);
      setNeedsOnboarding(true);
    } else {
      setProfile(existing);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = async (updates: {
    displayName?: string;
    avatarUrl?: string;
    timezone?: string;
    profileVisibility?: 'private' | 'public';
  }) => {
    if (!user || !profile) return;
    const updated = await createOrUpdateProfile({
      userId: user.uid,
      displayName: updates.displayName !== undefined ? updates.displayName : profile.displayName,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : profile.avatarUrl,
      timezone: updates.timezone !== undefined ? updates.timezone : profile.timezone,
      profileVisibility: updates.profileVisibility !== undefined ? updates.profileVisibility : profile.profileVisibility,
    });
    setProfile(updated);
  };

  const completeOnboarding = async (displayName: string, timezone: string) => {
    if (!user) return;
    const updated = await createOrUpdateProfile({
      userId: user.uid,
      displayName: displayName.trim(),
      timezone: timezone,
      profileVisibility: profile?.profileVisibility || 'private',
      avatarUrl: profile?.avatarUrl || '',
    });
    setProfile(updated);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        needsOnboarding,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOut,
        updateUserProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
