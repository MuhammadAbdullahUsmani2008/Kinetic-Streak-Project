import React, { useState } from 'react';
import { Flame, Compass, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COMMON_TIMEZONES, getUserSystemTimezone } from '../utils/dateUtils';
import { createActivity } from '../services/activityService';
import { getLocalDateString } from '../utils/dateUtils';

interface OnboardingModalProps {
  isOpen: boolean;
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onFinish }) => {
  const { user, profile, completeOnboarding } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [timezone, setTimezone] = useState(profile?.timezone || getUserSystemTimezone());
  const [firstActivityTitle, setFirstActivityTitle] = useState('Daily Morning Reading');
  const [firstActivityType, setFirstActivityType] = useState<'habit' | 'task'>('habit');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await completeOnboarding(displayName || 'User', timezone);

      if (firstActivityTitle.trim()) {
        const today = getLocalDateString(timezone);
        await createActivity({
          ownerId: user.uid,
          title: firstActivityTitle.trim(),
          description: 'Started during onboarding',
          activityType: firstActivityType,
          scheduleType: 'daily',
          scheduleDays: [1, 2, 3, 4, 5, 6, 7],
          timezone,
          startDate: today,
          visibility: 'private',
        });
      }

      onFinish();
    } catch (err) {
      console.error('Onboarding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Welcome to Kinetik</h2>
              <p className="text-xs text-stone-500">Let’s configure your consistency workspace in 30 seconds</p>
            </div>
          </div>
          <button
            onClick={onFinish}
            className="text-xs font-semibold text-stone-400 hover:text-stone-600 transition"
          >
            Skip for now
          </button>
        </div>

        <form onSubmit={handleComplete} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya Chen"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Primary Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              Your streaks will reset at midnight in this timezone, with a provisional model protecting your daytime progress.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-900">Your First Target Activity</span>
              </div>
              <div className="flex gap-1 bg-white p-0.5 rounded-md border border-teal-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFirstActivityType('habit')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    firstActivityType === 'habit' ? 'bg-teal-600 text-white' : 'text-stone-600'
                  }`}
                >
                  Habit
                </button>
                <button
                  type="button"
                  onClick={() => setFirstActivityType('task')}
                  className={`px-2 py-0.5 rounded font-medium ${
                    firstActivityType === 'task' ? 'bg-teal-600 text-white' : 'text-stone-600'
                  }`}
                >
                  Task
                </button>
              </div>
            </div>

            <input
              type="text"
              value={firstActivityTitle}
              onChange={(e) => setFirstActivityTitle(e.target.value)}
              placeholder="e.g. Write code for 45 mins, Morning meditation, Read 20 pages"
              className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-teal-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
            <p className="text-[11px] text-teal-700/80">
              Scheduled daily. You can adjust weekdays or link it to a project later anytime.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Setting up...' : 'Get Started with Kinetik'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
