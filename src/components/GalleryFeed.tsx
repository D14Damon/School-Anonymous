import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import { PostTag } from '../types';
import { 
  Search, 
  EyeOff, 
  PlusCircle, 
  School as SchoolIcon,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';

const ALL_TAGS: (PostTag | 'All')[] = [
  'All',
  'Confessions',
  'Shoutouts',
  'ngl / tbh / fr',
  'Rants & Vent',
  'Questions & Curious',
  'Appreciation',
];

export const GalleryFeed: React.FC = () => {
  const {
    posts,
    activeSchoolFilter,
    setActiveSchoolFilter,
    approvedSchools,
    currentUser,
    setIsCreatePostModalOpen,
    setIsAuthModalOpen,
    setActiveView,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<PostTag | 'All'>('All');
  const [anonymityFilter, setAnonymityFilter] = useState<'all' | 'anonymous' | 'named'>('all');
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);

  // Target school: either current filter, or user's registered school, or first available school
  const currentSchoolId = (activeSchoolFilter !== 'all' && activeSchoolFilter)
    ? activeSchoolFilter
    : (currentUser?.schoolId && currentUser.schoolId !== 'unassigned'
        ? currentUser.schoolId
        : (approvedSchools[0]?.id || ''));

  const activeSchoolObj = approvedSchools.find((s) => s.id === currentSchoolId) || approvedSchools[0];

  // Filter posts strictly by this school, tag, anonymity, and search query
  const filteredPosts = posts.filter((post) => {
    // School filter: posts must belong to this school
    if (activeSchoolObj && post.schoolId !== activeSchoolObj.id) {
      return false;
    }
    // Tag filter
    if (selectedTag !== 'All' && post.tag !== selectedTag) {
      return false;
    }
    // Anonymity filter
    if (anonymityFilter === 'anonymous' && !post.isAnonymous) {
      return false;
    }
    if (anonymityFilter === 'named' && post.isAnonymous) {
      return false;
    }
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchCaption = post.caption?.toLowerCase().includes(q);
      const matchAuthor = post.authorName?.toLowerCase().includes(q);
      const matchSchool = post.schoolName?.toLowerCase().includes(q);
      if (!matchCaption && !matchAuthor && !matchSchool) return false;
    }
    return true;
  });

  // Guarantee most recent post is at the top
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeB - timeA;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      
      {/* Top Campus Board Banner */}
      <div className="relative p-5 sm:p-7 rounded-2xl bg-gradient-to-r from-[#12141f] via-[#10121a] to-[#15121b] border border-[#262c3e] shadow-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <SchoolIcon className="w-3 h-3 text-red-400" />
              <span>Campus Wall</span>
            </span>

            {/* Philippine Time Indicator */}
            <span className="px-2.5 py-0.5 rounded-full bg-[#161a25] border border-[#2c344a] text-slate-300 text-[10px] font-mono flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-red-400" />
              <span>Philippine Time (PHT, UTC+8)</span>
            </span>

            {activeSchoolObj?.location && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#161a25] border border-[#2c344a] text-slate-300 text-[10px] font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>{activeSchoolObj.location}</span>
              </span>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-gothic font-bold text-slate-100 tracking-wide">
              {activeSchoolObj ? `${activeSchoolObj.name.toUpperCase()} BOARD` : 'CAMPUS CONFESSIONS & WHISPERS'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registered school feed. All whispers, rants, and confessions chronologically ordered with newest at top.
            </p>
          </div>
        </div>

        {/* Right actions: School switch & Inscribe post */}
        <div className="flex items-center gap-2.5 z-10 shrink-0 flex-wrap">
          {/* Switch Campus Dropdown */}
          {approvedSchools.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className="px-3 py-2.5 rounded-xl bg-[#161824] hover:bg-[#1d2130] border border-[#2e3448] text-xs font-semibold text-slate-300 transition-colors flex items-center gap-2"
              >
                <SchoolIcon className="w-3.5 h-3.5 text-red-400" />
                <span className="max-w-[120px] truncate">
                  {activeSchoolObj ? activeSchoolObj.name : 'Select School'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isSchoolDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#141622] border border-[#2f3549] rounded-xl shadow-2xl p-1.5 z-50">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-[#232838] mb-1">
                    Switch School Campus
                  </div>
                  {approvedSchools.map((sch) => (
                    <button
                      key={sch.id}
                      onClick={() => {
                        setActiveSchoolFilter(sch.id);
                        setIsSchoolDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                        activeSchoolObj?.id === sch.id
                          ? 'bg-red-950/70 text-red-300 font-bold'
                          : 'text-slate-300 hover:bg-[#1e2233]'
                      }`}
                    >
                      <span className="truncate pr-2">{sch.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 font-mono">
                        {sch.postCount}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setIsSchoolDropdownOpen(false);
                      setActiveView('schools');
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:text-red-300 hover:bg-[#1a1720] rounded-lg mt-1 border-t border-[#232838]"
                  >
                    View full school directory →
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (!currentUser) setIsAuthModalOpen(true);
              else setIsCreatePostModalOpen(true);
            }}
            className="px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-red-300" />
            <span>New Post</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-red-950/25 blur-3xl pointer-events-none"></div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search confessions, hashtags, or scholars..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#11131c] border border-[#232738] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Anonymity Filter Controls */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#11131c] border border-[#232738] self-start md:self-auto">
            <button
              onClick={() => setAnonymityFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                anonymityFilter === 'all'
                  ? 'bg-[#1f2334] text-slate-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAnonymityFilter('anonymous')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                anonymityFilter === 'anonymous'
                  ? 'bg-red-950 text-red-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-3 h-3 text-red-400" />
              <span>Compelled</span>
            </button>
            <button
              onClick={() => setAnonymityFilter('named')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                anonymityFilter === 'named'
                  ? 'bg-[#1f2334] text-slate-200 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Public
            </button>
          </div>
        </div>

        {/* Category Tags Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedTag === t
                  ? 'bg-red-950 text-red-300 border border-red-800/80 shadow-sm'
                  : 'bg-[#11131c] text-slate-400 hover:text-slate-200 border border-[#212534]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout: Responsive across mobile/tablet/iPad/PC */}
      {sortedPosts.length === 0 ? (
        <div className="p-12 sm:p-16 text-center rounded-2xl bg-[#0f1118] border border-[#222736] space-y-4">
          <EyeOff className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-gothic font-semibold text-slate-200">
              No Whispers in this School Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Be the first to post text or photo to {activeSchoolObj?.name || 'this school'}!
            </p>
          </div>
          <button
            onClick={() => {
              if (!currentUser) setIsAuthModalOpen(true);
              else setIsCreatePostModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white font-gothic text-xs font-semibold transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Post</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};
