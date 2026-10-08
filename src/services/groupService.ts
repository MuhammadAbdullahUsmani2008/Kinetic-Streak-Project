/**
 * Group & Invitation Service
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
  increment,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Group, GroupInvitation, GroupMember, Visibility } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { getUserProfile } from './profileService';

export async function getUserGroups(userId: string): Promise<{
  group: Group;
  membership: GroupMember;
}[]> {
  const path = 'groupMembers';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const memberships = snap.docs.map((d) => d.data() as GroupMember);

    const results: { group: Group; membership: GroupMember }[] = [];

    for (const mem of memberships) {
      const gDoc = await getDoc(doc(db, 'groups', mem.groupId));
      if (gDoc.exists()) {
        results.push({
          group: gDoc.data() as Group,
          membership: mem,
        });
      }
    }

    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const path = `groups/${groupId}`;
  try {
    const snap = await getDoc(doc(db, 'groups', groupId));
    if (!snap.exists()) return null;
    return snap.data() as Group;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function createGroup({
  name,
  description,
  visibility,
  ownerId,
}: {
  name: string;
  description?: string;
  visibility: Visibility;
  ownerId: string;
}): Promise<Group> {
  const groupId = 'grp_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  const path = `groups/${groupId}`;
  const now = new Date().toISOString();
  const today = getLocalDateString('UTC');

  const group: Group = {
    groupId,
    ownerId,
    name: name.trim(),
    description: description?.trim() || '',
    visibility,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // 1. Create group document
    await setDoc(doc(db, 'groups', groupId), group);

    // 2. Create owner's membership
    const membershipId = `mem_${groupId}_${ownerId}`;
    const ownerProfile = await getUserProfile(ownerId);

    const ownerMember: GroupMember = {
      membershipId,
      groupId,
      userId: ownerId,
      role: 'owner',
      status: 'active',
      joinedAt: now,
      eligibilityStartDate: today,
      createdAt: now,
      updatedAt: now,
      displayName: ownerProfile?.displayName || 'Owner',
      avatarUrl: ownerProfile?.avatarUrl,
    };

    await setDoc(doc(db, 'groupMembers', membershipId), ownerMember);
    return group;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'visibility' | 'ownerId'>>
): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    await updateDoc(doc(db, 'groups', groupId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  const path = `groups/${groupId}`;
  try {
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const path = 'groupMembers';
  try {
    const q = query(collection(db, path), where('groupId', '==', groupId));
    const snap = await getDocs(q);
    const members = snap.docs.map((d) => d.data() as GroupMember);

    // Hydrate display names & avatars from profiles if missing
    for (const mem of members) {
      if (!mem.displayName) {
        const prof = await getUserProfile(mem.userId);
        if (prof) {
          mem.displayName = prof.displayName;
          mem.avatarUrl = prof.avatarUrl;
        }
      }
    }

    return members;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function createGroupInvitation({
  groupId,
  userId,
  maxUses,
  expiresInDays,
}: {
  groupId: string;
  userId: string;
  maxUses?: number;
  expiresInDays?: number;
}): Promise<GroupInvitation> {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const invitationId = `inv_${groupId}_${inviteCode}`;
  const path = `groupInvitations/${invitationId}`;
  const now = new Date();

  let expiresAt: string | null = null;
  if (expiresInDays && expiresInDays > 0) {
    const exp = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  const invitation: GroupInvitation = {
    invitationId,
    groupId,
    inviteCode,
    tokenHash: inviteCode, // secure identifier
    createdBy: userId,
    expiresAt,
    maxUses: maxUses || null,
    useCount: 0,
    revokedAt: null,
    createdAt: now.toISOString(),
  };

  try {
    await setDoc(doc(db, 'groupInvitations', invitationId), invitation);
    return invitation;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getGroupInvitations(groupId: string): Promise<GroupInvitation[]> {
  const path = 'groupInvitations';
  try {
    const q = query(collection(db, path), where('groupId', '==', groupId));
    const snap = await getDocs(q);
    const invites = snap.docs.map((d) => d.data() as GroupInvitation);
    return invites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const path = `groupInvitations/${invitationId}`;
  try {
    await updateDoc(doc(db, 'groupInvitations', invitationId), {
      revokedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function joinGroupByCode(
  code: string,
  userId: string
): Promise<{ group: Group; member: GroupMember }> {
  const normalizedCode = code.trim().toUpperCase();

  // Find matching invitation
  const invitesSnap = await getDocs(
    query(collection(db, 'groupInvitations'), where('inviteCode', '==', normalizedCode))
  );

  if (invitesSnap.empty) {
    throw new Error('Invalid invitation code. Please check and try again.');
  }

  const invitation = invitesSnap.docs[0].data() as GroupInvitation;

  // Validate invitation status
  if (invitation.revokedAt) {
    throw new Error('This invitation has been revoked by the group owner.');
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
    throw new Error('This invitation has expired.');
  }

  if (invitation.maxUses && invitation.useCount >= invitation.maxUses) {
    throw new Error('This invitation has reached its maximum permitted uses.');
  }

  // Fetch the group
  const group = await getGroup(invitation.groupId);
  if (!group) {
    throw new Error('The group associated with this invite could not be found.');
  }

  // Check existing membership
  const membershipId = `mem_${group.groupId}_${userId}`;
  const existingMemSnap = await getDoc(doc(db, 'groupMembers', membershipId));

  const now = new Date().toISOString();
  const today = getLocalDateString('UTC');
  const userProfile = await getUserProfile(userId);

  if (existingMemSnap.exists()) {
    const existing = existingMemSnap.data() as GroupMember;
    if (existing.status === 'active') {
      throw new Error('You are already an active member of this group.');
    }

    // Rejoining member: reactivate, reset eligibility date to today (no retroactive credit)
    const updatedMember: GroupMember = {
      ...existing,
      status: 'active',
      leftAt: null,
      joinedAt: now,
      eligibilityStartDate: today,
      updatedAt: now,
      displayName: userProfile?.displayName || existing.displayName || 'Member',
      avatarUrl: userProfile?.avatarUrl,
    };

    await setDoc(doc(db, 'groupMembers', membershipId), updatedMember);
    await updateDoc(doc(db, 'groups', group.groupId), {
      memberCount: increment(1),
      updatedAt: now,
    });
    await updateDoc(doc(db, 'groupInvitations', invitation.invitationId), {
      useCount: increment(1),
    });

    return { group, member: updatedMember };
  }

  // New membership
  const newMember: GroupMember = {
    membershipId,
    groupId: group.groupId,
    userId,
    role: 'member',
    status: 'active',
    joinedAt: now,
    eligibilityStartDate: today,
    createdAt: now,
    updatedAt: now,
    displayName: userProfile?.displayName || 'Member',
    avatarUrl: userProfile?.avatarUrl,
  };

  await setDoc(doc(db, 'groupMembers', membershipId), newMember);
  await updateDoc(doc(db, 'groups', group.groupId), {
    memberCount: increment(1),
    updatedAt: now,
  });
  await updateDoc(doc(db, 'groupInvitations', invitation.invitationId), {
    useCount: increment(1),
  });

  return { group, member: newMember };
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membershipId = `mem_${groupId}_${userId}`;
  const memSnap = await getDoc(doc(db, 'groupMembers', membershipId));

  if (!memSnap.exists()) return;
  const mem = memSnap.data() as GroupMember;

  const now = new Date().toISOString();
  await updateDoc(doc(db, 'groupMembers', membershipId), {
    status: 'left',
    leftAt: now,
    updatedAt: now,
  });

  await updateDoc(doc(db, 'groups', groupId), {
    memberCount: increment(-1),
    updatedAt: now,
  });
}

export async function removeMember(groupId: string, memberUserId: string): Promise<void> {
  return leaveGroup(groupId, memberUserId);
}
