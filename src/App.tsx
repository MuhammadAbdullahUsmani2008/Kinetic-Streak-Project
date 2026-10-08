/**
 * Kinetik - General-Purpose Streak & Accountability Platform
 * Root Application Component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavigationTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardPage } from './pages/DashboardPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { GroupsPage } from './pages/GroupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityModal } from './components/ActivityModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { ProjectModal } from './components/ProjectModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { CreateChallengeModal } from './components/CreateChallengeModal';
import { ChallengeDetailModal } from './components/ChallengeDetailModal';
import { Activity, Group, GroupChallenge, GroupMember, Project } from './types';
import { getUserActivities } from './services/activityService';
import { getUserProjects } from './services/projectService';
import { getUserGroups } from './services/groupService';
import { getGroupChallenges } from './services/challengeService';
import { Flame, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, needsOnboarding } = useAuth();

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Application Data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<{ group: Group; membership: GroupMember }[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signIn' | 'signUp'>('signIn');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [activityDetailOpen, setActivityDetailOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);

  const [createChallengeModalOpen, setCreateChallengeModalOpen] = useState(false);
  const [challengeTargetGroup, setChallengeTargetGroup] = useState<Group | null>(null);

  const [challengeDetailOpen, setChallengeDetailOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<GroupChallenge | null>(null);
  const [selectedChallengeMembership, setSelectedChallengeMembership] = useState<GroupMember | null>(null);

  // Load user data
  const loadUserData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [acts, projs, grps] = await Promise.all([
        getUserActivities(user.uid),
        getUserProjects(user.uid),
        getUserGroups(user.uid),
      ]);

      setActivities(acts);
      setProjects(projs);
      setGroups(grps);

      // Load all challenges from user's groups
      if (grps.length > 0) {
        const challengePromises = grps.map((g) => getGroupChallenges(g.group.groupId));
        const allGroupChallenges = await Promise.all(challengePromises);
        setChallenges(allGroupChallenges.flat());
      } else {
        setChallenges([]);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white mb-4 animate-pulse">
          <Flame className="w-6 h-6 fill-teal-100 text-teal-100" />
        </div>
        <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          <span>Starting Kinetik...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated user -> Landing Page
  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
      </>
    );
  }

  // Authenticated user
  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenCreateActivity={() => {
          setActivityToEdit(null);
          setActivityModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {dataLoading && activities.length === 0 ? (
          <div className="py-24 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Loading workspace data...</span>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                activities={activities}
                projects={projects}
                groups={groups}
                challenges={challenges}
                onOpenCreateActivity={() => {
                  setActivityToEdit(null);
                  setActivityModalOpen(true);
                }}
                onOpenCreateProject={() => {
                  setProjectToEdit(null);
                  setProjectModalOpen(true);
                }}
                onOpenJoinGroup={() => setJoinGroupModalOpen(true)}
                onSelectActivity={(act) => {
                  setSelectedActivity(act);
                  setActivityDetailOpen(true);
                }}
                onSelectChallenge={(ch) => {
                  const grp = groups.find((g) => g.group.groupId === ch.groupId);
                  if (grp) {
                    setSelectedChallenge(ch);
                    setSelectedChallengeMembership(grp.membership);
                    setChallengeDetailOpen(true);
                  }
                }}
                onRefreshData={loadUserData}
              />
            )}

            {currentTab === 'activities' && (
              <ActivitiesPage
                activities={activities}
                projects={projects}
                onOpenCreateActivity={() => {
                  setActivityToEdit(null);
                  setActivityModalOpen(true);
                }}
                onSelectActivity={(act) => {
                  setSelectedActivity(act);
                  setActivityDetailOpen(true);
                }}
                onEditActivity={(act) => {
                  setActivityToEdit(act);
                  setActivityModalOpen(true);
                }}
                onRefreshData={loadUserData}
              />
            )}

            {currentTab === 'projects' && (
              <ProjectsPage
                projects={projects}
                activities={activities}
                onOpenCreateProject={() => {
                  setProjectToEdit(null);
                  setProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setProjectToEdit(proj);
                  setProjectModalOpen(true);
                }}
                onSelectActivity={(act) => {
                  setSelectedActivity(act);
                  setActivityDetailOpen(true);
                }}
                onRefreshData={loadUserData}
              />
            )}

            {currentTab === 'groups' && (
              <GroupsPage
                groups={groups}
                onOpenCreateGroup={() => setCreateGroupModalOpen(true)}
                onOpenJoinGroup={() => setJoinGroupModalOpen(true)}
                onOpenCreateChallenge={(group) => {
                  setChallengeTargetGroup(group);
                  setCreateChallengeModalOpen(true);
                }}
                onSelectChallenge={(ch, mem) => {
                  setSelectedChallenge(ch);
                  setSelectedChallengeMembership(mem);
                  setChallengeDetailOpen(true);
                }}
                onRefreshData={loadUserData}
              />
            )}

            {currentTab === 'settings' && <SettingsPage />}
          </>
        )}
      </main>

      {/* Modals */}
      <OnboardingModal isOpen={needsOnboarding} onFinish={loadUserData} />

      <ActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSaved={loadUserData}
        projects={projects}
        activityToEdit={activityToEdit}
      />

      <ActivityDetailModal
        isOpen={activityDetailOpen}
        onClose={() => setActivityDetailOpen(false)}
        activity={selectedActivity}
        project={projects.find((p) => p.projectId === selectedActivity?.projectId)}
        onEdit={(act) => {
          setActivityDetailOpen(false);
          setActivityToEdit(act);
          setActivityModalOpen(true);
        }}
        onRefreshList={loadUserData}
      />

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSaved={loadUserData}
        projectToEdit={projectToEdit}
      />

      <CreateGroupModal
        isOpen={createGroupModalOpen}
        onClose={() => setCreateGroupModalOpen(false)}
        onCreated={() => {
          loadUserData();
          setCurrentTab('groups');
        }}
      />

      <JoinGroupModal
        isOpen={joinGroupModalOpen}
        onClose={() => setJoinGroupModalOpen(false)}
        onJoined={() => {
          loadUserData();
          setCurrentTab('groups');
        }}
      />

      {challengeTargetGroup && (
        <CreateChallengeModal
          isOpen={createChallengeModalOpen}
          onClose={() => {
            setCreateChallengeModalOpen(false);
            setChallengeTargetGroup(null);
          }}
          onCreated={loadUserData}
          group={challengeTargetGroup}
        />
      )}

      <ChallengeDetailModal
        isOpen={challengeDetailOpen}
        onClose={() => setChallengeDetailOpen(false)}
        challenge={selectedChallenge}
        userMembership={selectedChallengeMembership}
        onRefresh={loadUserData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
