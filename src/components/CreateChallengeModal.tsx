import React, { useState } from 'react';
import { X, Trophy, AlertCircle, Clock } from 'lucide-react';
import { Group, ScheduleType } from '../types';
import { COMMON_TIMEZONES, getLocalDateString } from '../utils/dateUtils';
import { createGroupChallenge } from '../services/challengeService';
import { useAuth } from '../context/AuthContext';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  group: Group;
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

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  group,
}) => {
  const { user, profile } = useAuth();
  const tz = profile?.timezone || 'UTC';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [timezone, setTimezone] = useState(tz);
  const [startDate, setStartDate] = useState(getLocalDateString(tz));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const toggleDay = (dayId: number) => {
    if (scheduleDays.includes(dayId)) {
      if (scheduleDays.length === 1) return;
      setScheduleDays(scheduleDays.filter((d) => d !== dayId));
    } else {
      setScheduleDays([...scheduleDays, dayId].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a challenge title.');
      return;
    }

    if (hasEndDate && endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createGroupChallenge({
        groupId: group.groupId,
        createdBy: user.uid,
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate: hasEndDate && endDate ? endDate : null,
        scheduleType,
        scheduleDays: scheduleType === 'daily' ? [1, 2, 3, 4, 5, 6, 7] : scheduleDays,
        timezone,
      });

      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create challenge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-stone-900">New Group Challenge</h2>
          </div>
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

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Challenge Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Days of 10,000 Steps, Read 1 Chapter Daily"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Guidelines, requirements, or shared motivation"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-none"
            />
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
            )}
          </div>

          {/* Fixed Challenge Timezone */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Fixed Challenge Timezone
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
              >
                {COMMON_TIMEZONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              All participants follow this challenge's fixed timezone to ensure unified daily deadlines.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Start Date</label>
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
                  checked={hasEndDate}
                  onChange={(e) => setHasEndDate(e.target.checked)}
                  className="rounded text-teal-600"
                />
              </div>
              <input
                type="date"
                disabled={!hasEndDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:bg-stone-100 disabled:text-stone-400"
              />
            </div>
          </div>

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
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
