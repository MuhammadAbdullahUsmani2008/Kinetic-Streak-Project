import React, { useState } from 'react';
import {
  Flame,
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Users2,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab = 'dashboard' | 'projects' | 'activities' | 'groups' | 'settings';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenCreateActivity: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateActivity,
}) => {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'activities', label: 'Habits & Tasks', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'groups', label: 'Groups & Challenges', icon: <Users2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-stone-900 font-bold text-xl tracking-tight hover:opacity-85 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
                <Flame className="w-5 h-5 fill-teal-100 text-teal-100" />
              </div>
              <span>Kinetik</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-50 text-teal-800'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action buttons & Profile */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenCreateActivity}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+ New Activity</span>
            </button>

            <div className="h-5 w-px bg-stone-200 mx-1" />

            {/* User profile capsule */}
            <button
              onClick={() => onSelectTab('settings')}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-100 transition text-left cursor-pointer"
              title="Profile & Settings"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-stone-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs uppercase">
                  {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || <UserIcon className="w-4 h-4" />}
                </div>
              )}
              <div className="text-xs">
                <p className="font-semibold text-stone-900 max-w-[120px] truncate">
                  {profile?.displayName || 'User'}
                </p>
                <p className="text-stone-500 text-[10px] truncate max-w-[120px]">{profile?.timezone || 'UTC'}</p>
              </div>
            </button>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCreateActivity}
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold cursor-pointer"
            >
              + New
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-stone-900">{profile?.displayName}</p>
                <p className="text-stone-500">{profile?.timezone}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 rounded-md font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
