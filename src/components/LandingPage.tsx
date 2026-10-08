import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  Trophy,
  Users2,
  CalendarCheck2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  Clock,
} from 'lucide-react';
import { calculateStreakStatistics } from '../utils/streakEngine';

interface LandingPageProps {
  onOpenAuth: (mode: 'signIn' | 'signUp') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  // Interactive Simulator State
  const [simDays, setSimDays] = useState<string[]>([
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
  ]);
  const [simSchedule, setSimSchedule] = useState<'daily' | 'weekdays'>('daily');

  const simResult = calculateStreakStatistics({
    scheduleType: simSchedule,
    scheduleDays: [1, 2, 3, 4, 5], // Mon-Fri
    startDate: '2026-10-01',
    completedDates: simDays,
    referenceDate: '2026-10-04',
  });

  const toggleSimDay = (date: string) => {
    if (simDays.includes(date)) {
      setSimDays(simDays.filter((d) => d !== date));
    } else {
      setSimDays([...simDays, date]);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Header */}
      <nav className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-5 h-5 fill-teal-100 text-teal-100" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-stone-900">Kinetik</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('signIn')}
              className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signUp')}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precision Streak & Accountability Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-950 leading-tight">
            Build Unbreakable Consistency.
            <br />
            <span className="text-teal-700">Prove It Every Day.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            A general-purpose tracking platform for habits, deep work tasks, multi-activity projects,
            and shared group challenges. Powered by deterministic scheduled-day rules and rigorous privacy controls.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onOpenAuth('signUp')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Tracking Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('signIn')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold text-base transition cursor-pointer"
            >
              Sign In to Your Workspace
            </button>
          </div>
        </section>

        {/* Live Interactive Engine Simulator */}
        <section className="py-12 bg-white border-y border-stone-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-stone-900">
                Experience the Provisional Streak Engine
              </h2>
              <p className="text-sm text-stone-500 mt-1 max-w-xl mx-auto">
                Test how Kinetik calculates consecutive completions without punishing unexpired days or unscheduled dates.
              </p>
            </div>

            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Interactive Activity Schedule</h3>
                  <p className="text-xs text-stone-500">Toggle simulated daily check-ins to view real engine output</p>
                </div>

                <div className="flex items-center gap-2 bg-stone-200/80 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setSimSchedule('daily')}
                    className={`px-3 py-1 rounded-md transition ${
                      simSchedule === 'daily' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    Every Day
                  </button>
                  <button
                    onClick={() => setSimSchedule('weekdays')}
                    className={`px-3 py-1 rounded-md transition ${
                      simSchedule === 'weekdays' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    Mon - Fri Only
                  </button>
                </div>
              </div>

              {/* Day selection pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-6">
                {[
                  { date: '2026-10-01', label: 'Thu, Oct 1' },
                  { date: '2026-10-02', label: 'Fri, Oct 2' },
                  { date: '2026-10-03', label: 'Sat, Oct 3' },
                  { date: '2026-10-04', label: 'Sun, Oct 4 (Today)' },
                ].map((item) => {
                  const isChecked = simDays.includes(item.date);
                  return (
                    <button
                      key={item.date}
                      onClick={() => toggleSimDay(item.date)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isChecked
                          ? 'bg-teal-50 border-teal-300 text-teal-900'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span
                        className={`text-[11px] font-semibold mt-2 inline-flex items-center gap-1 ${
                          isChecked ? 'text-teal-700' : 'text-stone-400'
                        }`}
                      >
                        {isChecked ? '✓ Completed' : '○ Not recorded'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Engine Output Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-stone-200 text-center">
                <div className="p-2">
                  <p className="text-[11px] uppercase font-bold text-stone-400">Current Streak</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Flame className="w-5 h-5 text-teal-600 fill-teal-100" />
                    <span className="text-2xl font-black text-stone-900">{simResult.currentStreak}</span>
                  </div>
                  {simResult.isProvisional && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Provisional (today pending)
                    </span>
                  )}
                </div>

                <div className="p-2 border-l border-stone-100">
                  <p className="text-[11px] uppercase font-bold text-stone-400">Longest Streak</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <span className="text-2xl font-black text-stone-900">{simResult.longestStreak}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Survives streak resets</span>
                </div>

                <div className="p-2 border-l border-stone-100">
                  <p className="text-[11px] uppercase font-bold text-stone-400">Total Completed</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-2xl font-black text-stone-900">{simResult.totalCompletedDays}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">Scheduled days only</span>
                </div>

                <div className="p-2 border-l border-stone-100">
                  <p className="text-[11px] uppercase font-bold text-stone-400">Today's State</p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        simResult.isCompletedToday
                          ? 'bg-emerald-100 text-emerald-800'
                          : simResult.isTodayScheduled
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {simResult.isCompletedToday
                        ? 'Done Today'
                        : simResult.isTodayScheduled
                        ? 'Pending Today'
                        : 'Unscheduled Day'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-stone-950">Architected for Long-Term Accountability</h2>
            <p className="text-base text-stone-500 mt-2">
              Everything you need to stay honest with yourself and your peers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Projects & Standalone Tasks</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Group multi-step habits within structured projects or track simple standalone daily tasks.
                  Neutral by design: studying, workouts, coding, mindfulness, or professional goals.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Custom schedules: daily or specific ISO weekdays
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
                  <Users2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Independent Group Challenges</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Create groups with invite codes. Participants pursue shared challenges simultaneously, but
                  one member's check-in never marks it complete for others. Late joiners start fairly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Strict late-joiner eligibility boundaries
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Dual Distinct Leaderboards</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Compare performance on two distinct leaderboards: Current Streak and Total Completed Days.
                  Calculated with standard competition ranking (1, 1, 3 for ties).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Separate tabs, no ambiguous composite scores
              </div>
            </div>
          </div>
        </section>

        {/* Security & Privacy Banner */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-stone-900 text-stone-100 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Trust Privacy</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Three Independent Visibility Tiers</h3>
              <p className="text-sm text-stone-300">
                Set privacy independently for your profile, each project, and each activity.
                A public project never leaks private activities, and group membership never reveals private notes.
              </p>
            </div>
            <button
              onClick={() => onOpenAuth('signUp')}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 font-bold text-sm shrink-0 transition cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <Flame className="w-4 h-4 text-teal-600 fill-teal-100" />
            <span>Kinetik Accountability Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Kinetik. All rights reserved. Focus on consistency.</p>
        </div>
      </footer>
    </div>
  );
};
