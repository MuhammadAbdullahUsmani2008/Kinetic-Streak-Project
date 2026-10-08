import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Layers,
  Lock,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { Activity, ActivityType, Project, ScheduleType, Visibility } from '../types';
import { COMMON_TIMEZONES, getLocalDateString } from '../utils/dateUtils';
import { createActivity, updateActivity } from '../services/activityService';
import { useAuth } from '../context/AuthContext';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projects: Project[];
  activityToEdit?: Activity | null;
}

const WEEKDAYS = [
  { id: 1, label: 'M', name: 'Monday' },
  { id: 2, label: 'T', name: 'Tuesday' },
  { id: 3, label: 'W', name: 'Wednesday' },
  { id: 4, label: 'T', name: 'Thursday' },
  { id: 5, label: 'F', name: 'Friday' },
  { id: 6, label: 'S', name: 'Saturday' },
  { id: 7, label: 'S', name: 'Sunday' },
];

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  projects,
  activityToEdit,
}) => {
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('habit');
  const [projectId, setProjectId] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [startDate, setStartDate] = useState(getLocalDateString(profile?.timezone || 'UTC'));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [status, setStatus] = useState<Activity['status']>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setActivityType(activityToEdit.activityType);
      setProjectId(activityToEdit.projectId || '');
      setScheduleType(activityToEdit.scheduleType);
      setScheduleDays(activityToEdit.scheduleDays || [1, 2, 3, 4, 5, 6, 7]);
      setTimezone(activityToEdit.timezone);
      setStartDate(activityToEdit.startDate);
      if (activityToEdit.endDate) {
        setHasEndDate(true);
        setEndDate(activityToEdit.endDate);
      } else {
        setHasEndDate(false);
        setEndDate('');
      }
      setVisibility(activityToEdit.visibility);
      setStatus(activityToEdit.status);
    } else {
      // New
      const tz = profile?.timezone || 'UTC';
      setTitle('');
      setDescription('');
      setActivityType('habit');
      setProjectId('');
      setScheduleType('daily');
      setScheduleDays([1, 2, 3, 4, 5, 6, 7]);
      setTimezone(tz);
      setStartDate(getLocalDateString(tz));
      setHasEndDate(false);
      setEndDate('');
      setVisibility('private');
      setStatus('active');
    }
    setError(null);
  }, [activityToEdit, isOpen, profile?.timezone]);

  if (!isOpen || !user) return null;

  const toggleDay = (dayId: number) => {
    if (scheduleDays.includes(dayId)) {
      if (scheduleDays.length === 1) {
        setError('At least one scheduled weekday is required.');
        return;
      }
      setScheduleDays(scheduleDays.filter((d) => d !== dayId));
    } else {
      setScheduleDays([...scheduleDays, dayId].sort());
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for this activity.');
      return;
    }

    if (scheduleType === 'weekdays' && scheduleDays.length === 0) {
      setError('Please select at least one weekday.');
      return;
    }

    if (hasEndDate && endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);

    try {
      if (activityToEdit) {
        await updateActivity(activityToEdit.activityId, {
          title: title.trim(),
          description: description.trim(),
          activityType,
          projectId: projectId || null,
          scheduleType,
          scheduleDays: scheduleType === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : scheduleDays,
          timezone,
          startDate,
          endDate: hasEndDate && endDate ? endDate : null,
          visibility,
          status,
        });
      } else {
        await createActivity({
          ownerId: user.uid,
          title: title.trim(),
          description: description.trim(),
          activityType,
          projectId: projectId || null,
          scheduleType,
          scheduleDays: scheduleType === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : scheduleDays,
          timezone,
          startDate,
          endDate: hasEndDate && endDate ? endDate : null,
          visibility,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">
            {activityToEdit ? 'Edit Activity' : 'Create New Activity'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Activity Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActivityType('habit')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  activityType === 'habit'
                    ? 'bg-teal-50 border-teal-600 text-teal-800'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Habit (Ongoing Routine)
              </button>
              <button
                type="button"
                onClick={() => setActivityType('task')}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  activityType === 'task'
                    ? 'bg-teal-50 border-teal-600 text-teal-800'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Task (Target Objective)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 20 pages, 30 min cardio, Leetcode problem"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add personal notes, criteria for completion, or context"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-none"
            />
          </div>

          {/* Optional Project */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Link to Project (Optional)
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
              >
                <option value="">Standalone (No Project)</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">Recurrence Schedule</label>
              <div className="flex gap-1 bg-stone-200/60 p-0.5 rounded-md text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setScheduleType('daily')}
                  className={`px-2.5 py-1 rounded transition ${
                    scheduleType === 'daily' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Every Day
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('weekdays')}
                  className={`px-2.5 py-1 rounded transition ${
                    scheduleType === 'weekdays' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Selected Days
                </button>
              </div>
            </div>

            {scheduleType === 'weekdays' && (
              <div>
                <p className="text-[11px] text-stone-500 mb-2">
                  Streaks only require completion on chosen days. Unscheduled days will never break your streak.
                </p>
                <div className="flex gap-1.5 justify-between">
                  {WEEKDAYS.map((w) => {
                    const isSelected = scheduleDays.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleDay(w.id)}
                        title={w.name}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">Optional End Date</label>
                <input
                  type="checkbox"
                  id="hasEnd"
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="rounded text-teal-600 cursor-pointer"
                />
              </div>
              <input
                type="date"
                disabled={!hasEndDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                placeholder="Indefinite duration"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:bg-stone-100 disabled:text-stone-400"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Activity Timezone
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Local midnight in this timezone marks the end of the day.
            </p>
          </div>

          {/* Visibility and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
              >
                <option value="private">Private (Only You)</option>
                <option value="public">Public (Visible on Profile)</option>
              </select>
            </div>

            {activityToEdit && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Activity['status'])}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : activityToEdit ? 'Save Changes' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
