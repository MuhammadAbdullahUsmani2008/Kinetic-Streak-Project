import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Trophy,
  ArrowRight,
  Sparkles,
  Layers,
  Users2,
  AlertCircle,
} from 'lucide-react';
import { Activity, Group, GroupChallenge, GroupMember, Project } from '../types';
import { recordActivityCheckIn } from '../services/activityService';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface DashboardPageProps {
  activities: Activity[];
  projects: Project[];
  groups: { group: Group; membership: GroupMember }[];
  challenges: GroupChallenge[];
  onOpenCreateActivity: () => void;
  onOpenCreateProject: () => void;
  onOpenJoinGroup: () => void;
  onSelectActivity: (activity: Activity) => void;
  onSelectChallenge: (challenge: GroupChallenge) => void;
  onRefreshData: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  activities,
  projects,
  groups,
  challenges,
  onOpenCreateActivity,
  onOpenCreateProject,
  onOpenJoinGroup,
  onSelectActivity,
  onSelectChallenge,
  onRefreshData,
}) => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tz = profile?.timezone || 'UTC';
  const today = getLocalDateString(tz);

  // Filter activities scheduled for today
  const scheduledToday = activities.filter((act) => {
    if (act.status !== 'active') return false;
    if (act.startDate > today) return false;
    if (act.endDate && act.endDate < today) return false;
    if (act.scheduleType === 'daily') return true;

    // Check weekday
    const [year, month, day] = today.split('-').map(Number);
    const jsDate = new Date(Date.UTC(year, month - 1, day));
    const jsDay = jsDate.getUTCDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return act.scheduleDays.includes(isoDay);
  });

  const completedTodayCount = scheduledToday.filter(
    (a) => a.lastCompletedDate === today
  ).length;

  const activeStreaksCount = activities.filter((a) => a.currentStreak > 0).length;
  const bestStreak = activities.reduce((max, a) => Math.max(max, a.longestStreak), 0);

  const displayedActivities = scheduledToday.filter((a) => {
    const isDone = a.lastCompletedDate === today;
    if (filter === 'completed') return isDone;
    if (filter === 'pending') return !isDone;
    return true;
  });

  const handleQuickCheckIn = async (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setProcessingId(activity.activityId);
    setError(null);

    try {
      await recordActivityCheckIn({
        activity,
        localDate: today,
      });

      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.65 },
      });

      onRefreshData();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Check-in failed.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Date Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                timeZone: tz,
              })}{' '}
              • {tz}
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-950 mt-1">
            Welcome back, {profile?.displayName || 'Explorer'}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {scheduledToday.length > 0
              ? `You have ${scheduledToday.length - completedTodayCount} activities pending today.`
              : 'No activities scheduled for today. Take a breather or plan your next challenge!'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateActivity}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity</span>
          </button>
          <button
            onClick={onOpenJoinGroup}
            className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Users2 className="w-4 h-4" />
            <span>Join Group</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-teal-600 text-teal-600" />
            Active Streaks
          </span>
          <p className="text-3xl font-black text-stone-950 mt-2">{activeStreaksCount}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">Habits with running momentum</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Today's Progress
          </span>
          <p className="text-3xl font-black text-stone-950 mt-2">
            {completedTodayCount}{' '}
            <span className="text-sm font-normal text-stone-400">/ {scheduledToday.length}</span>
          </p>
          <span className="text-[11px] text-stone-400 mt-1 block">Scheduled for {today}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            Longest Streak
          </span>
          <p className="text-3xl font-black text-stone-950 mt-2">{bestStreak}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">Personal record high</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
            <Users2 className="w-4 h-4 text-indigo-600" />
            Group Challenges
          </span>
          <p className="text-3xl font-black text-stone-950 mt-2">{challenges.length}</p>
          <span className="text-[11px] text-stone-400 mt-1 block">Active group challenges</span>
        </div>
      </div>

      {/* Today's Scheduled Activities */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Today's Scheduled Activities</h2>
            <p className="text-xs text-stone-500">
              Only activities scheduled for today appear here. Tap to mark complete.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              All ({scheduledToday.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'pending' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Pending ({scheduledToday.length - completedTodayCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'completed' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Done ({completedTodayCount})
            </button>
          </div>
        </div>

        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-stone-200 text-stone-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-semibold">
              {filter === 'completed'
                ? 'No activities completed yet today.'
                : filter === 'pending'
                ? 'All of today’s scheduled activities are complete! Well done.'
                : 'No activities scheduled for today.'}
            </p>
            {scheduledToday.length === 0 && (
              <button
                onClick={onOpenCreateActivity}
                className="text-xs text-teal-600 hover:underline font-semibold cursor-pointer"
              >
                + Create your first habit or task
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            {displayedActivities.map((act) => {
              const isDone = act.lastCompletedDate === today;
              const isProcessing = processingId === act.activityId;
              const linkedProj = projects.find((p) => p.projectId === act.projectId);

              return (
                <div
                  key={act.activityId}
                  onClick={() => onSelectActivity(act)}
                  className={`p-4 flex items-center justify-between gap-4 transition cursor-pointer hover:bg-stone-50 ${
                    isDone ? 'bg-stone-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      disabled={isDone || isProcessing}
                      onClick={(e) => handleQuickCheckIn(e, act)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-stone-300 hover:border-teal-600 text-transparent hover:text-teal-600'
                      }`}
                      title={isDone ? 'Completed today' : 'Click to complete'}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isDone ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                        >
                          {act.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            act.activityType === 'habit'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {act.activityType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                        {linkedProj && (
                          <span className="flex items-center gap-1 text-stone-500">
                            <Layers className="w-3 h-3" />
                            {linkedProj.title}
                          </span>
                        )}
                        <span>
                          {act.scheduleType === 'daily'
                            ? 'Daily'
                            : `${act.scheduleDays.length} weekdays`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Streak Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 font-bold text-xs text-teal-800 bg-teal-50 px-2 py-1 rounded-md">
                        <Flame className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                        <span>{act.currentStreak} day streak</span>
                      </div>
                      <span className="block text-[10px] text-stone-400 mt-0.5">
                        {isDone ? 'Checked in' : 'Provisional pending'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Group Challenges Spotlight */}
      {challenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Active Group Challenges</h2>
              <p className="text-xs text-stone-500">
                Shared challenges with your groups. Check in and compete on dual leaderboards.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {challenges.map((ch) => {
              const grp = groups.find((g) => g.group.groupId === ch.groupId)?.group;
              return (
                <div
                  key={ch.challengeId}
                  onClick={() => onSelectChallenge(ch)}
                  className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="font-semibold text-teal-700">{grp?.name || 'Group'}</span>
                      <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-[10px]">
                        <Clock className="w-3 h-3" />
                        {ch.timezone}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900">{ch.title}</h3>
                    {ch.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{ch.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-teal-600">
                    <span>View Challenge & Leaderboards</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
