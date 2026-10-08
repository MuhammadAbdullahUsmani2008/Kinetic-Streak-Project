import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Activity, ActivityStatus, ActivityType, Project } from '../types';
import { deleteActivity, recordActivityCheckIn, updateActivity } from '../services/activityService';
import { getLocalDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface ActivitiesPageProps {
  activities: Activity[];
  projects: Project[];
  onOpenCreateActivity: () => void;
  onSelectActivity: (activity: Activity) => void;
  onEditActivity: (activity: Activity) => void;
  onRefreshData: () => void;
}

export const ActivitiesPage: React.FC<ActivitiesPageProps> = ({
  activities,
  projects,
  onOpenCreateActivity,
  onSelectActivity,
  onEditActivity,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('active');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredActivities = activities.filter((act) => {
    if (searchTerm && !act.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (typeFilter !== 'all' && act.activityType !== typeFilter) {
      return false;
    }
    if (statusFilter !== 'all' && act.status !== statusFilter) {
      return false;
    }
    if (projectFilter !== 'all') {
      if (projectFilter === 'standalone' && act.projectId) return false;
      if (projectFilter !== 'standalone' && act.projectId !== projectFilter) return false;
    }
    return true;
  });

  const handleQuickCheckIn = async (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    const today = getLocalDateString(activity.timezone);
    try {
      await recordActivityCheckIn({
        activity,
        localDate: today,
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });

      onRefreshData();
    } catch (err: any) {
      alert(err?.message || 'Check-in failed');
    }
  };

  const handleDelete = async (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${activity.title}"?`)) return;
    try {
      await deleteActivity(activity.activityId);
      onRefreshData();
    } catch (err) {
      alert('Failed to delete activity.');
    }
  };

  const handleTogglePause = async (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    const nextStatus = activity.status === 'active' ? 'paused' : 'active';
    try {
      await updateActivity(activity.activityId, { status: nextStatus });
      onRefreshData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-950">Habits & Tasks</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your personal recurring routines, task lists, and track consecutive streaks.
          </p>
        </div>

        <button
          onClick={onOpenCreateActivity}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Activity</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search habits and tasks..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-hidden focus:border-teal-600"
            >
              <option value="all">All Types</option>
              <option value="habit">Habits Only</option>
              <option value="task">Tasks Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-hidden focus:border-teal-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white focus:outline-hidden focus:border-teal-600"
            >
              <option value="all">All Projects</option>
              <option value="standalone">Standalone Only</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  Project: {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activities Grid / List */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-white text-stone-500 space-y-2">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-700">No activities match your filters</p>
          <p className="text-xs text-stone-400">
            Create a new habit or adjust your search filter options above.
          </p>
          <button
            onClick={onOpenCreateActivity}
            className="mt-2 text-xs text-teal-600 font-bold hover:underline cursor-pointer"
          >
            + Create New Activity
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredActivities.map((act) => {
            const today = getLocalDateString(act.timezone);
            const isDone = act.lastCompletedDate === today;
            const linkedProj = projects.find((p) => p.projectId === act.projectId);

            return (
              <div
                key={act.activityId}
                onClick={() => onSelectActivity(act)}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          act.activityType === 'habit'
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {act.activityType}
                      </span>
                      {act.status !== 'active' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {act.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditActivity(act);
                        }}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, act)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-stone-900">{act.title}</h3>
                  {act.description && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">{act.description}</p>
                  )}

                  {linkedProj && (
                    <div className="inline-flex items-center gap-1 text-[11px] text-stone-500 mt-2 bg-stone-100 px-2 py-0.5 rounded">
                      <Layers className="w-3 h-3 text-stone-400" />
                      <span>{linkedProj.title}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-bold text-xs text-teal-800">
                      <Flame className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                      <span>{act.currentStreak} streak</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Best: {act.longestStreak}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleQuickCheckIn(e, act)}
                    disabled={isDone || act.status !== 'active'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isDone ? 'Done Today' : 'Check In'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
