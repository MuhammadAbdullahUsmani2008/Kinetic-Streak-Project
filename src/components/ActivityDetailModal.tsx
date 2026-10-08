import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Activity, CheckIn, Project } from '../types';
import {
  getActivityCheckIns,
  recordActivityCheckIn,
  recalculateActivityStats,
  deleteActivity,
  updateActivity,
} from '../services/activityService';
import { getLocalDateString } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  project?: Project | null;
  onEdit: (activity: Activity) => void;
  onRefreshList: () => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
  project,
  onEdit,
  onRefreshList,
}) => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const loadCheckIns = async () => {
    if (!activity) return;
    setLoading(true);
    try {
      const data = await getActivityCheckIns(activity.activityId);
      setCheckIns(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load completion history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activity && isOpen) {
      loadCheckIns();
      setError(null);
      setNote('');
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  const today = getLocalDateString(activity.timezone);
  const isCompletedToday = checkIns.some((c) => c.localDate === today);

  const handleCheckInToday = async () => {
    setCheckInLoading(true);
    setError(null);
    try {
      const { checkIn } = await recordActivityCheckIn({
        activity,
        localDate: today,
        note: note.trim() || undefined,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setCheckIns([checkIn, ...checkIns]);
      onRefreshList();
    } catch (err: any) {
      setError(err?.message || 'Check-in failed.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError(null);
    try {
      await recalculateActivityStats(activity);
      await loadCheckIns();
      onRefreshList();
    } catch (err: any) {
      setError('Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${activity.title}"?`)) {
      return;
    }
    try {
      await deleteActivity(activity.activityId);
      onRefreshList();
      onClose();
    } catch (err: any) {
      setError('Could not delete activity.');
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = activity.status === 'active' ? 'paused' : 'active';
    try {
      await updateActivity(activity.activityId, { status: nextStatus });
      onRefreshList();
      onClose();
    } catch (err: any) {
      setError('Could not update status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activity.activityType === 'habit'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {activity.activityType}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activity.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {activity.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(activity)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition cursor-pointer"
              title="Edit Activity"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleStatus}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              {activity.status === 'active' ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Delete Activity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-stone-950">{activity.title}</h1>
            {activity.description && (
              <p className="text-sm text-stone-600 mt-1 whitespace-pre-wrap">{activity.description}</p>
            )}
            {project && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                <Layers className="w-3.5 h-3.5" />
                <span>Project: <strong>{project.title}</strong></span>
              </div>
            )}
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100">
              <span className="text-[10px] font-bold uppercase text-teal-800 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-teal-600 text-teal-600" />
                Current Streak
              </span>
              <p className="text-2xl font-black text-teal-950 mt-1">{activity.currentStreak}</p>
              <span className="text-[10px] text-teal-700/80">
                {isCompletedToday ? 'Completed today' : 'Pending today'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                Longest Streak
              </span>
              <p className="text-2xl font-black text-amber-950 mt-1">{activity.longestStreak}</p>
              <span className="text-[10px] text-amber-700/80">Personal best</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Total Days
              </span>
              <p className="text-2xl font-black text-emerald-950 mt-1">{activity.totalCompletedDays}</p>
              <span className="text-[10px] text-emerald-700/80">Scheduled dates</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] font-bold uppercase text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Last Completed
              </span>
              <p className="text-sm font-bold text-stone-800 mt-2">
                {activity.lastCompletedDate || 'Never'}
              </p>
              <span className="text-[10px] text-stone-400">Date recorded</span>
            </div>
          </div>

          {/* Today's Check-In Banner */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-900">
                Today ({today} in {activity.timezone})
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {isCompletedToday
                  ? 'Completed for today. Awesome consistency!'
                  : 'Ready to mark today complete? Record your check-in below.'}
              </p>
            </div>

            {isCompletedToday ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/80 px-3.5 py-1.5 rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Marked Complete</span>
              </div>
            ) : (
              <button
                onClick={handleCheckInToday}
                disabled={checkInLoading || activity.status !== 'active'}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{checkInLoading ? 'Recording...' : 'Mark Done Today'}</span>
              </button>
            )}
          </div>

          {/* Completion History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-900">
                Completion History ({checkIns.length})
              </h3>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                <span>Recalculate Stats</span>
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-stone-400">Loading history...</div>
            ) : checkIns.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-stone-200 text-xs text-stone-500">
                No completions recorded yet. Your first check-in starts your streak!
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto border border-stone-200 rounded-xl">
                {checkIns.map((item) => (
                  <div key={item.checkInId} className="p-3 text-xs flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-stone-900">{item.localDate}</span>
                        {item.note && (
                          <p className="text-[11px] text-stone-500 italic mt-0.5">"{item.note}"</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
