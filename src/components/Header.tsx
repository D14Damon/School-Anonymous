import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isCreatorEmail } from '../utils/security';
import { 
  Eye, 
  EyeOff, 
  PlusCircle, 
  ShieldCheck, 
  School as SchoolIcon, 
  Image as ImageIcon, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  ArrowLeftRight,
  ShieldCheck as ShieldCheckIcon,
  Users
} from 'lucide-react';
import logoImg from '../assets/images/gothic_school_logo_1788974588737.jpg';

export const Header: React.FC = () => {
  const {
    currentUser,
    activeView,
    setActiveView,
    activeSchoolFilter,
    setActiveSchoolFilter,
    approvedSchools,
    pendingSchoolCount,
    toggleAnonymity,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setIsCreatePostModalOpen,
    logout,
    schoolSwitchCooldown,
    getSchoolMemberCount,
    getSchoolPostCount,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSchoolSelectOpen, setIsSchoolSelectOpen] = useState(false);

  const isCreator = isCreatorEmail(currentUser?.email);
  const hasApprovedSchool = approvedSchools.length > 0 && 
    Boolean(currentUser?.schoolId && currentUser.schoolId !== 'unassigned' && approvedSchools.some((s) => s.id === currentUser.schoolId));
  const canPost = approvedSchools.length > 0 && (isCreator || (hasApprovedSchool && (activeSchoolFilter === 'all' || activeSchoolFilter === currentUser?.schoolId)));

  const selectedSchool = approvedSchools.find((s) => s.id === activeSchoolFilter) || 
    approvedSchools.find((s) => s.id === currentUser?.schoolId) ||
    approvedSchools[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#232734] bg-[#0c0d12]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Gothic Brand Identity */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => {
                setActiveView('feed');
                setActiveSchoolFilter('all');
              }}
              className="group flex items-center space-x-2.5 sm:space-x-3 text-left focus:outline-none"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-[#3a3f52] shadow-md group-hover:border-[#991b1b] transition-colors shrink-0">
                <img
                  src={logoImg}
                  alt="School Anonymous Crest"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-gothic text-base sm:text-xl font-bold tracking-wider text-slate-100 flex items-center gap-1 group-hover:text-red-400 transition-colors">
                  SCHOOL ANONYMOUS
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                </span>
              </div>
            </button>

            {/* School Filter Selector Pill (Desktop/Tablet) */}
            {approvedSchools.length > 0 && (
              <div className="relative hidden md:block ml-2">
                <button
                  onClick={() => setIsSchoolSelectOpen(!isSchoolSelectOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#161822] border border-[#2a2e40] text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                  title="Filter feed by school"
                >
                  <SchoolIcon className="w-3.5 h-3.5 text-red-500" />
                  <span className="max-w-[130px] truncate font-medium">
                    {selectedSchool ? selectedSchool.name : 'All Schools'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isSchoolSelectOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-[#141620] border border-[#2e3346] rounded-xl shadow-2xl p-1.5 z-50">
                    <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-[#232838] mb-1">
                      Campus Board
                    </div>
                    {approvedSchools.map((sch) => (
                      <button
                        key={sch.id}
                        onClick={() => {
                          setActiveSchoolFilter(sch.id);
                          setActiveView('feed');
                          setIsSchoolSelectOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                          activeSchoolFilter === sch.id
                            ? 'bg-red-950/60 text-red-300 font-medium'
                            : 'text-slate-300 hover:bg-[#1f2333]'
                        }`}
                      >
                        <span className="truncate pr-2">{sch.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 font-mono">
                          {getSchoolPostCount(sch.id)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Navigation Links (Desktop & Tablet) */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => {
                if (currentUser?.schoolId && currentUser.schoolId !== 'unassigned') {
                  setActiveSchoolFilter(currentUser.schoolId);
                }
                setActiveView('feed');
              }}
              className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'feed'
                  ? 'bg-[#1a1e2a] text-red-400 border border-red-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141622]'
              }`}
            >
              <SchoolIcon className="w-4 h-4 text-red-500" />
              <span className="truncate max-w-[150px]">
                {currentUser?.role === 'creator'
                  ? (activeSchoolFilter && activeSchoolFilter !== 'all'
                      ? (approvedSchools.find((s) => s.id === activeSchoolFilter)?.name || 'Campus Feed')
                      : 'Campus Feed')
                  : currentUser?.schoolId && approvedSchools.some((s) => s.id === currentUser.schoolId)
                  ? `${currentUser.schoolName || 'Campus'} Feed`
                  : 'Campus Feed'}
              </span>
            </button>

            <button
              onClick={() => setActiveView('schools')}
              className={`px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'schools'
                  ? 'bg-[#1a1e2a] text-red-400 border border-red-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141622]'
              }`}
            >
              <span>Switch School {approvedSchools.length > 0 && `(${approvedSchools.length})`}</span>
            </button>

            {/* Creator Approvals - Strictly for Creator Account Only */}
            {isCreator && (
              <button
                onClick={() => setActiveView('creator-chamber')}
                className={`relative px-3 py-2 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'creator-chamber'
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-[#1a1614]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Creator Approvals</span>
                {pendingSchoolCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono animate-pulse">
                    {pendingSchoolCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Create Post Button - Only visible if an approved school exists and user belongs to it or is creator */}
            {canPost && (
              <button
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsCreatePostModalOpen(true);
                  }
                }}
                className="flex items-center space-x-1 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/60 text-white text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-300" />
                <span className="hidden sm:inline">Post</span>
                <span className="sm:hidden">Post</span>
              </button>
            )}

            {/* User Profile / Compelled Controls */}
            {currentUser ? (
              <div className="relative">
                <div className="flex items-center space-x-1.5 bg-[#141620] border border-[#2b3042] rounded-xl p-1">
                  
                  {/* Compelled Toggle Button */}
                  <button
                    onClick={toggleAnonymity}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                      currentUser.isAnonymous
                        ? 'bg-red-950/90 text-red-200 border border-red-700 shadow-md ring-1 ring-red-500/30'
                        : 'bg-[#181c28] text-slate-400 hover:text-slate-200 border border-[#2b3042]'
                    }`}
                    title={currentUser.isAnonymous ? 'Compelled is ON (Identity & profile hidden)' : 'Compelled is OFF (Full profile shown)'}
                  >
                    {currentUser.isAnonymous ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="font-bold tracking-wide">Compelled</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-800 text-white font-mono uppercase">ON</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">Compelled</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#24293c] text-slate-400 font-mono uppercase">OFF</span>
                      </>
                    )}
                  </button>

                  {/* Profile Trigger */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1.5 pl-1 pr-1.5 py-0.5 rounded-lg hover:bg-[#1f2334] transition-colors focus:outline-none"
                  >
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#3b4158] shrink-0">
                      <img
                        src={currentUser.avatarBase64}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {currentUser.isAnonymous && (
                        <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                          <EyeOff className="w-3 h-3 text-red-300" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-200 max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
                      {currentUser.isAnonymous
                        ? currentUser.anonymousNickname
                          ? `@${currentUser.anonymousNickname}`
                          : 'Compelled'
                        : currentUser.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#141620] border border-[#2e3346] rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-[#232736]">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {currentUser.isAnonymous
                          ? currentUser.anonymousNickname
                            ? `@${currentUser.anonymousNickname} (Identity Veiled)`
                            : 'Compelled Scholar'
                          : currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center justify-between">
                        <span className="truncate">{currentUser.schoolName || 'No Campus'}</span>
                        {currentUser.schoolId && currentUser.schoolId !== 'unassigned' && (
                          <span className="text-red-400 font-mono text-[10px] flex items-center gap-1 shrink-0 ml-1">
                            <Users className="w-2.5 h-2.5" />
                            <span>{getSchoolMemberCount(currentUser.schoolId)} {getSchoolMemberCount(currentUser.schoolId) === 1 ? 'member' : 'members'}</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentUser.isAnonymous ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                        <span className="text-slate-300 truncate">
                          {currentUser.isAnonymous
                            ? 'Compelled ON (All profile details hidden)'
                            : 'Compelled OFF (Full details visible)'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#1f2334] rounded-lg transition-colors flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('schools');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#1f2334] rounded-lg transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="w-4 h-4 text-red-400" />
                          <span>Switch School</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          schoolSwitchCooldown.isCreator
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : schoolSwitchCooldown.canSwitch
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-red-950/80 text-red-300 border border-red-800/60'
                        }`}>
                          {schoolSwitchCooldown.isCreator
                            ? 'No Cooldown'
                            : schoolSwitchCooldown.canSwitch
                            ? 'Available'
                            : schoolSwitchCooldown.formattedRemaining}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          toggleAnonymity();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#1f2334] rounded-lg transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {currentUser.isAnonymous ? (
                            <>
                              <Eye className="w-4 h-4 text-emerald-400" />
                              <span>Turn Compelled OFF</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 text-red-400" />
                              <span>Turn Compelled ON</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {currentUser.isAnonymous ? 'Show Details' : 'Hide Details'}
                        </span>
                      </button>

                      {isCreator && (
                        <button
                          onClick={() => {
                            setActiveView('creator-chamber');
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/30 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>Creator Panel</span>
                          </div>
                          {pendingSchoolCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono">
                              {pendingSchoolCount}
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-[#232736]">
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#161822] hover:bg-[#1f2334] border border-[#2e3346] text-xs font-semibold text-slate-200 tracking-wider transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar for phones & small tablets */}
        <div className="flex sm:hidden items-center justify-around py-2.5 border-t border-[#1d202c] text-xs font-medium">
          <button
            onClick={() => {
              if (currentUser?.schoolId && currentUser.schoolId !== 'unassigned') {
                setActiveSchoolFilter(currentUser.schoolId);
              }
              setActiveView('feed');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              activeView === 'feed' ? 'text-red-400 font-bold bg-[#171a25]' : 'text-slate-400'
            }`}
          >
            <SchoolIcon className="w-3.5 h-3.5" />
            <span>Campus</span>
          </button>
          <button
            onClick={() => setActiveView('schools')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeView === 'schools' ? 'text-red-400 font-bold bg-[#171a25]' : 'text-slate-400'
            }`}
          >
            Switch School {approvedSchools.length > 0 && `(${approvedSchools.length})`}
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveView('creator-chamber')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                activeView === 'creator-chamber' ? 'text-amber-400 font-bold bg-[#1c1815]' : 'text-slate-400'
              }`}
            >
              Creator
              {pendingSchoolCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
