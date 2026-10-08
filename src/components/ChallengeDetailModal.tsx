import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Users2,
  AlertCircle,
  Medal,
} from 'lucide-react';
import { GroupChallenge, LeaderboardEntry, GroupMember } from '../types';
import {
  getChallengeCheckIns,
  getChallengeLeaderboards,
  recordChallengeCheckIn,
} from '../services/challengeService';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: GroupChallenge | null;
  userMembership: GroupMember | null;
  onRefresh: () => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  isOpen,
  onClose,
  challenge,
  userMembership,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'streak' | 'totalDays'>('streak');
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalDaysLeaderboard, setTotalDaysLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!challenge) return;
    setLoading(true);
    try {
      const { streakLeaderboard: sLb, totalDaysLeaderboard: tLb } =
        await getChallengeLeaderboards(challenge.challengeId);
      setStreakLeaderboard(sLb);
      setTotalDaysLeaderboard(tLb);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load leaderboards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (challenge && isOpen) {
      loadData();
      setError(null);
    }
  }, [challenge, isOpen]);

  if (!isOpen || !challenge || !user) return null;

  const todayInChallengeTz = getLocalDateString(challenge.timezone);

  // Check if current user already completed today
  const userEntry = streakLeaderboard.find((e) => e.userId === user.uid);
  const isUserCompletedToday = userEntry?.isCompletedToday ?? false;

  const handleCheckIn = async () => {
    if (!userMembership) return;
    setCheckingIn(true);
    setError(null);

    try {
      await recordChallengeCheckIn({
        challenge,
        userId: user.uid,
        localDate: todayInChallengeTz,
        memberEligibilityDate: userMembership.eligibilityStartDate,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      await loadData();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const currentList = activeTab === 'streak' ? streakLeaderboard : totalDaysLeaderboard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">Group Challenge Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Metadata */}
          <div>
            <h1 className="text-xl font-bold text-stone-950">{challenge.title}</h1>
            {challenge.description && (
              <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{challenge.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Timezone: <strong>{challenge.timezone}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {challenge.scheduleType === 'daily'
                    ? 'Every Day'
                    : `Weekdays (${challenge.scheduleDays.length} days)`}
                </span>
              </span>
              {challenge.endDate && (
                <span className="inline-flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-md">
                  <span>Ends: {challenge.endDate}</span>
                </span>
              )}
            </div>
          </div>

          {/* Personal Check-In Section */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>Your Individual Daily Check-In</span>
              </div>
              <p className="text-xs text-teal-800/80 mt-1">
                Local date: <strong>{todayInChallengeTz}</strong>. One member's check-in never completes for others!
              </p>
              {userMembership && (
                <p className="text-[11px] text-teal-700/70 mt-0.5">
                  Eligible participation started: {userMembership.eligibilityStartDate}
                </p>
              )}
            </div>

            {isUserCompletedToday ? (
              <div className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're Done Today</span>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn || challenge.status !== 'active'}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>{checkingIn ? 'Recording...' : 'Mark Done Today'}</span>
              </button>
            )}
          </div>

          {/* Dual Leaderboards */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-stone-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('streak')}
                  className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                    activeTab === 'streak'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-teal-100 text-teal-600" />
                  <span>Leaderboard A: Current Streak</span>
                </button>
                <button
                  onClick={() => setActiveTab('totalDays')}
                  className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                    activeTab === 'totalDays'
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Leaderboard B: Total Completed Days</span>
                </button>
              </div>

              <span className="text-[11px] text-stone-400 pb-2 hidden sm:inline">
                Competition Ranking (1, 1, 3 for ties)
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">Loading rankings...</div>
            ) : currentList.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                No active participants or check-ins yet.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {currentList.map((entry, idx) => {
                  const isMe = entry.userId === user.uid;
                  return (
                    <div
                      key={entry.userId}
                      className={`p-3.5 flex items-center justify-between text-xs transition ${
                        isMe ? 'bg-teal-50/50 font-semibold' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center font-bold text-stone-600">
                          {entry.rank === 1 ? (
                            <span className="text-amber-500 text-sm font-black">🥇 1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-slate-400 text-sm font-black">🥈 2</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-amber-700 text-sm font-black">🥉 3</span>
                          ) : (
                            <span className="text-stone-400 font-bold">#{entry.rank}</span>
                          )}
                        </div>

                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-stone-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px] uppercase">
                            {entry.displayName.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-900">{entry.displayName}</span>
                            {isMe && (
                              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          {entry.eligibilityStartDate && (
                            <p className="text-[10px] text-stone-400">
                              Eligible since {entry.eligibilityStartDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 font-bold text-stone-900 text-sm justify-end">
                          {activeTab === 'streak' ? (
                            <>
                              <Flame className="w-4 h-4 fill-teal-600 text-teal-600" />
                              <span>{entry.score} days</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{entry.score} total</span>
                            </>
                          )}
                        </div>
                        {activeTab === 'streak' && (
                          <span
                            className={`text-[10px] ${
                              entry.isCompletedToday ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {entry.isCompletedToday ? 'Done today' : 'Pending today'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
