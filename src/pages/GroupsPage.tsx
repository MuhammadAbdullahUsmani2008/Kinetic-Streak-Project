import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  KeyRound,
  Trophy,
  Copy,
  Check,
  Ban,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  LogOut,
  Trash2,
  Lock,
  Globe,
} from 'lucide-react';
import { Group, GroupChallenge, GroupInvitation, GroupMember } from '../types';
import {
  createGroupInvitation,
  deleteGroup,
  getGroupInvitations,
  getGroupMembers,
  leaveGroup,
  removeMember,
  revokeInvitation,
} from '../services/groupService';
import { getGroupChallenges } from '../services/challengeService';
import { useAuth } from '../context/AuthContext';

interface GroupsPageProps {
  groups: { group: Group; membership: GroupMember }[];
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onOpenCreateChallenge: (group: Group) => void;
  onSelectChallenge: (challenge: GroupChallenge, membership: GroupMember) => void;
  onRefreshData: () => void;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({
  groups,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onOpenCreateChallenge,
  onSelectChallenge,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    groups[0]?.group.groupId || ''
  );
  const [activeTab, setActiveTab] = useState<'challenges' | 'members' | 'invites'>('challenges');

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Invite Form State
  const [inviteMaxUses, setInviteMaxUses] = useState<number | ''>('');
  const [inviteExpireDays, setInviteExpireDays] = useState<number | ''>(7);
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Synchronize selected group
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].group.groupId);
    }
  }, [groups, selectedGroupId]);

  const activeGroupItem = groups.find((g) => g.group.groupId === selectedGroupId);
  const isOwner = activeGroupItem?.membership.role === 'owner';

  const loadGroupDetails = async () => {
    if (!selectedGroupId) return;
    setLoadingDetails(true);
    try {
      const [mems, chs, invs] = await Promise.all([
        getGroupMembers(selectedGroupId),
        getGroupChallenges(selectedGroupId),
        isOwner ? getGroupInvitations(selectedGroupId) : Promise.resolve([]),
      ]);
      setMembers(mems);
      setChallenges(chs);
      setInvitations(invs);
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails();
    }
  }, [selectedGroupId, isOwner]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !user) return;
    setCreatingInvite(true);
    try {
      await createGroupInvitation({
        groupId: selectedGroupId,
        userId: user.uid,
        maxUses: inviteMaxUses ? Number(inviteMaxUses) : undefined,
        expiresInDays: inviteExpireDays ? Number(inviteExpireDays) : undefined,
      });
      await loadGroupDetails();
      setInviteMaxUses('');
    } catch (err) {
      alert('Failed to create invitation.');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      await revokeInvitation(invitationId);
      await loadGroupDetails();
    } catch (err) {
      alert('Failed to revoke invitation.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !selectedGroupId) return;
    if (!window.confirm('Are you sure you want to leave this accountability group?')) return;
    try {
      await leaveGroup(selectedGroupId, user.uid);
      onRefreshData();
    } catch (err) {
      alert('Failed to leave group.');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!selectedGroupId) return;
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await removeMember(selectedGroupId, memberUserId);
      await loadGroupDetails();
      onRefreshData();
    } catch (err) {
      alert('Failed to remove member.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroupId) return;
    if (!window.confirm('Are you sure you want to permanently delete this group and all its challenges?')) return;
    try {
      await deleteGroup(selectedGroupId);
      onRefreshData();
    } catch (err) {
      alert('Failed to delete group.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-950">Groups & Challenges</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Share accountability with friends, colleagues, or teams with independent check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenJoinGroup}
            className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>Join with Code</span>
          </button>
          <button
            onClick={onOpenCreateGroup}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white text-stone-500 space-y-3">
          <Users2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">You haven’t joined any groups yet</h2>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Accountability is 2x stronger with peers. Create your own group or join an existing one using an invite code.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onOpenCreateGroup}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Create a Group
            </button>
            <button
              onClick={onOpenJoinGroup}
              className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Enter Invite Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column: Groups Selector */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block px-1">
              Your Groups ({groups.length})
            </span>
            <div className="space-y-1">
              {groups.map(({ group, membership }) => {
                const isSelected = group.groupId === selectedGroupId;
                return (
                  <button
                    key={group.groupId}
                    onClick={() => {
                      setSelectedGroupId(group.groupId);
                      setActiveTab('challenges');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs font-bold'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs">{group.name}</span>
                      {membership.role === 'owner' && (
                        <span
                          className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-teal-700 text-teal-100' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          Owner
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1 ${
                        isSelected ? 'text-teal-100' : 'text-stone-400'
                      }`}
                    >
                      {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Group View */}
          <div className="lg:col-span-3 space-y-5">
            {activeGroupItem && (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
                {/* Group Top Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-stone-950">
                        {activeGroupItem.group.name}
                      </h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          activeGroupItem.group.visibility === 'public'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {activeGroupItem.group.visibility}
                      </span>
                    </div>
                    {activeGroupItem.group.description && (
                      <p className="text-xs text-stone-500 mt-1 whitespace-pre-wrap">
                        {activeGroupItem.group.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner ? (
                      <button
                        onClick={handleDeleteGroup}
                        className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveGroup}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave Group</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center justify-between border-b border-stone-200">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('challenges')}
                      className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                        activeTab === 'challenges'
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Challenges ({challenges.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                        activeTab === 'members'
                          ? 'border-teal-600 text-teal-700'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Members ({members.length})
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => setActiveTab('invites')}
                        className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                          activeTab === 'invites'
                            ? 'border-teal-600 text-teal-700'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Invite Codes ({invitations.length})
                      </button>
                    )}
                  </div>

                  {activeTab === 'challenges' && isOwner && (
                    <button
                      onClick={() => onOpenCreateChallenge(activeGroupItem.group)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer pb-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Challenge</span>
                    </button>
                  )}
                </div>

                {/* Tab Content: Challenges */}
                {activeTab === 'challenges' && (
                  <div className="space-y-4">
                    {challenges.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-stone-200 text-stone-400 space-y-2">
                        <Trophy className="w-8 h-8 mx-auto text-stone-300" />
                        <p className="text-xs font-semibold">No challenges created for this group yet</p>
                        {isOwner && (
                          <button
                            onClick={() => onOpenCreateChallenge(activeGroupItem.group)}
                            className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
                          >
                            + Create a Group Challenge
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {challenges.map((ch) => (
                          <div
                            key={ch.challengeId}
                            onClick={() =>
                              onSelectChallenge(ch, activeGroupItem.membership)
                            }
                            className="p-4 rounded-xl border border-stone-200 hover:border-teal-300 transition cursor-pointer bg-stone-50/50 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                                <span>{ch.timezone}</span>
                                <span>
                                  {ch.scheduleType === 'daily'
                                    ? 'Daily'
                                    : `${ch.scheduleDays.length} weekdays`}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-stone-900">{ch.title}</h3>
                              {ch.description && (
                                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                                  {ch.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-teal-600">
                              <span>Check In & Leaderboards</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content: Members */}
                {activeTab === 'members' && (
                  <div className="space-y-3">
                    <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                      {members.map((mem) => {
                        const isMe = mem.userId === user?.uid;
                        return (
                          <div
                            key={mem.membershipId}
                            className="p-3.5 flex items-center justify-between text-xs bg-white"
                          >
                            <div className="flex items-center gap-3">
                              {mem.avatarUrl ? (
                                <img
                                  src={mem.avatarUrl}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-stone-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
                                  {mem.displayName?.charAt(0) || 'M'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-stone-900">
                                  <span>{mem.displayName || 'Member'}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded">
                                      You
                                    </span>
                                  )}
                                  {mem.role === 'owner' && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400">
                                  Joined on {mem.eligibilityStartDate}
                                </span>
                              </div>
                            </div>

                            {isOwner && !isMe && mem.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveMember(mem.userId)}
                                className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab Content: Invitations (Owner Only) */}
                {activeTab === 'invites' && isOwner && (
                  <div className="space-y-6">
                    {/* Create Invitation Box */}
                    <form
                      onSubmit={handleCreateInvite}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3"
                    >
                      <h3 className="text-xs font-bold text-stone-900">Generate New Invite Code</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Expires In (Days)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={inviteExpireDays}
                            onChange={(e) =>
                              setInviteExpireDays(e.target.value ? Number(e.target.value) : '')
                            }
                            placeholder="7"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Max Uses (Optional)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={inviteMaxUses}
                            onChange={(e) =>
                              setInviteMaxUses(e.target.value ? Number(e.target.value) : '')
                            }
                            placeholder="Unlimited"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={creatingInvite}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        {creatingInvite ? 'Generating...' : 'Create Invite Code'}
                      </button>
                    </form>

                    {/* Active Invitations List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-900 block">Existing Invites</span>
                      {invitations.length === 0 ? (
                        <p className="text-xs text-stone-400">No invitations created yet.</p>
                      ) : (
                        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                          {invitations.map((inv) => {
                            const isRevoked = Boolean(inv.revokedAt);
                            const isExpired =
                              inv.expiresAt && new Date(inv.expiresAt) < new Date();
                            const isMaxed =
                              inv.maxUses && inv.useCount >= inv.maxUses;

                            return (
                              <div
                                key={inv.invitationId}
                                className="p-3 text-xs flex items-center justify-between bg-white"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm text-stone-900 tracking-wider">
                                      {inv.inviteCode}
                                    </span>
                                    {isRevoked ? (
                                      <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                        Revoked
                                      </span>
                                    ) : isExpired ? (
                                      <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded font-bold">
                                        Expired
                                      </span>
                                    ) : isMaxed ? (
                                      <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded font-bold">
                                        Maxed Out
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-400">
                                    Uses: {inv.useCount} {inv.maxUses ? `/ ${inv.maxUses}` : ''}
                                    {inv.expiresAt && ` • Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyCode(inv.inviteCode)}
                                    className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition cursor-pointer flex items-center gap-1"
                                    title="Copy Code"
                                  >
                                    {copiedCode === inv.inviteCode ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  {!isRevoked && (
                                    <button
                                      onClick={() => handleRevokeInvite(inv.invitationId)}
                                      className="p-1.5 rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      title="Revoke Invite"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
