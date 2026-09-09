import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { isCreatorEmail } from './utils/security';
import { Header } from './components/Header';
import { GalleryFeed } from './components/GalleryFeed';
import { SchoolDirectory } from './components/SchoolDirectory';
import { CreatorPanel } from './components/CreatorPanel';
import { AuthScreen } from './components/AuthScreen';
import { SchoolOnboardingScreen } from './components/SchoolOnboardingScreen';
import { ProfileModal } from './components/ProfileModal';
import { CreatePostModal } from './components/CreatePostModal';
import { PostDetailModal } from './components/PostDetailModal';
import { ShieldCheck, School, Loader2 } from 'lucide-react';
import logoImg from './assets/images/gothic_school_logo_1788974588737.jpg';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    authLoading, 
    activeView, 
    setActiveView, 
    approvedSchools, 
    pendingSchoolCount 
  } = useApp();

  // 1. Initial Authentication Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center space-y-4 text-slate-300">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#2d3348] p-0.5 bg-[#0a0c12] shadow-xl">
          <img
            src={logoImg}
            alt="School Anonymous"
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-red-400">
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
          <span>Verifying Security Protocol...</span>
        </div>
      </div>
    );
  }

  // 2. Pre-entry Gate: Unauthenticated users MUST authenticate first
  if (!currentUser) {
    return <AuthScreen />;
  }

  const isCreator = isCreatorEmail(currentUser?.email);

  // 3. Post-Auth Onboarding: User must choose or register their school
  const needsSchoolSelection = 
    !currentUser.schoolId || 
    currentUser.schoolId === 'unassigned' || 
    !currentUser.schoolName;

  if (needsSchoolSelection && !isCreator) {
    return <SchoolOnboardingScreen />;
  }

  // 4. Main Screen: Authenticated and Enlisted in School
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0e] text-[#e2e8f0]">
      {/* Top Header */}
      <Header />

      {/* Main View Area */}
      <main className="flex-1">
        {activeView === 'feed' && <GalleryFeed />}
        {activeView === 'schools' && <SchoolDirectory />}
        {activeView === 'creator-chamber' && (isCreator ? <CreatorPanel /> : <GalleryFeed />)}
      </main>

      {/* Modals & Overlays */}
      <ProfileModal />
      <CreatePostModal />
      <PostDetailModal />

      {/* Aesthetic Footer */}
      <footer className="border-t border-[#1c1f2b] bg-[#07080b] py-8 px-4 sm:px-6 lg:px-8 mt-12 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#2b2f40] shrink-0">
              <img
                src={logoImg}
                alt="School Anonymous"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-gothic text-sm sm:text-base font-bold text-slate-200 tracking-wider">
                SCHOOL ANONYMOUS
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={() => setActiveView('feed')}
              className="hover:text-red-400 transition-colors"
            >
              Feed
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setActiveView('schools')}
              className="hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <School className="w-3.5 h-3.5" />
              <span>Schools {approvedSchools.length > 0 && `(${approvedSchools.length})`}</span>
            </button>
            {isCreator && (
              <>
                <span className="text-slate-700">•</span>
                <button
                  onClick={() => setActiveView('creator-chamber')}
                  className="hover:text-amber-400 text-amber-400/90 transition-colors flex items-center gap-1 font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Creator Approvals {pendingSchoolCount > 0 && `(${pendingSchoolCount})`}</span>
                </button>
              </>
            )}
          </div>

          <div className="text-center sm:text-right text-xs text-slate-500">
            © {new Date().getFullYear()} School Anonymous • Protected
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
