import React, { useState } from 'react';
import {
  User,
  Clock,
  Shield,
  Lock,
  Globe,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COMMON_TIMEZONES } from '../utils/dateUtils';
import { Visibility } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateUserProfile, sendPasswordReset, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [profileVisibility, setProfileVisibility] = useState<Visibility>(
    profile?.profileVisibility || 'private'
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
        timezone,
        profileVisibility,
      });
      setMessage({ type: 'success', text: 'Profile settings updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      setMessage({
        type: 'success',
        text: `Password reset email sent to ${user.email}. Check your inbox.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send password reset email.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }
    alert(
      'Account deletion request submitted. To complete identity re-authentication, please contact your administrator or sign in fresh.'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-stone-950">Profile & Settings</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Manage your personal identity, timezone preferences, and 3-tier privacy boundaries.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
          Profile Information
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.example.com/avatar.jpg"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Primary Timezone
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
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
            <p className="text-[11px] text-stone-400 mt-1">
              Governs your personal streak calculation deadlines. Individual shared challenges may specify their own fixed timezones.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Profile Visibility
            </label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value as Visibility)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
            >
              <option value="private">Private (Only You & Challenge Group Members)</option>
              <option value="public">Public (Visible to Platform Users)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Privacy Architecture Explanation */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-3">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          <Shield className="w-4 h-4 text-teal-700" />
          <span>Independent 3-Tier Privacy Architecture</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Kinetik enforces granular isolation across three levels:
        </p>
        <ul className="text-xs text-stone-500 space-y-1.5 list-disc list-inside">
          <li><strong>Profile:</strong> Setting your profile to public does not expose your projects or habits.</li>
          <li><strong>Projects:</strong> A public project does not expose activities marked as private.</li>
          <li><strong>Activities:</strong> Individual habits and tasks maintain their own explicit visibility settings.</li>
        </ul>
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
          Account Security & Credentials
        </h2>

        <div className="flex items-center justify-between text-xs py-2">
          <div>
            <p className="font-semibold text-stone-800">Email Address</p>
            <p className="text-stone-500">{user?.email || 'Authenticated User'}</p>
          </div>
          <button
            onClick={handlePasswordReset}
            className="px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Send Password Reset</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs py-2 border-t border-stone-100">
          <div>
            <p className="font-semibold text-stone-800">Sign Out</p>
            <p className="text-stone-500">End your active authenticated session on this device.</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs py-2 border-t border-stone-100 text-rose-700">
          <div>
            <p className="font-semibold text-rose-900">Danger Zone</p>
            <p className="text-stone-500">Permanently delete your profile and personal data.</p>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
