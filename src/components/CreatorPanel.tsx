import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isCreatorEmail } from '../utils/security';
import { PostReactions } from '../types';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  PlusCircle,
  Trash2,
  Copy
} from 'lucide-react';

export const CreatorPanel: React.FC = () => {
  const {
    currentUser,
    schools,
    approveSchool,
    declineSchool,
    deleteSchool,
    submitNewSchool,
    setActiveView,
    setActiveSchoolFilter,
    posts,
    boostPostReaction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'declined'>('pending');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quick creator add school state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newSchoolCountry, setNewSchoolCountry] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [boostingPostId, setBoostingPostId] = useState<string | null>(null);
  const [boostPostId, setBoostPostId] = useState('');
  const [boostAmount, setBoostAmount] = useState('1');
  const [boostReaction, setBoostReaction] = useState<keyof PostReactions>('like');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const pendingSchools = schools.filter((s) => s.status === 'pending');
  const approvedSchools = schools.filter((s) => s.status === 'approved');
  const declinedSchools = schools.filter((s) => s.status === 'declined');

  const isCreator = isCreatorEmail(currentUser?.email);

  if (!isCreator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/70 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-gothic font-bold text-slate-100">Restricted to Website Creator</h2>
        <p className="text-xs text-slate-400">
          This panel is solely authorized for franklinkyleluzano@gmail.com.
        </p>
        <button
          onClick={() => setActiveView('feed')}
          className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-semibold"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const handleApprove = async (schoolId: string, schoolName: string) => {
    const note = reviewNotes[schoolId] || 'Approved by Website Creator';
    try {
      await approveSchool(schoolId, note);
      setSuccessToast(`"${schoolName}" approved and added to the School Section.`);
    } catch {
      setSuccessToast(`Could not approve "${schoolName}". Check Firestore rules and deployment.`);
    }
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDecline = async (schoolId: string, schoolName: string) => {
    const note = reviewNotes[schoolId] || 'Declined by Website Creator';
    try {
      await declineSchool(schoolId, note);
      setSuccessToast(`"${schoolName}" declined.`);
    } catch {
      setSuccessToast(`Could not decline "${schoolName}". Check Firestore rules and deployment.`);
    }
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleBoost = async (postId: string, reactionType: keyof PostReactions, amount = 1) => {
    setBoostingPostId(`${postId}:${reactionType}`);
    const result = await boostPostReaction(postId, reactionType, amount);
    setBoostingPostId(null);
    setSuccessToast(result.success ? 'Reaction boosted.' : (result.error || 'Reaction boost failed.'));
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleManualBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(boostAmount);
    const postId = boostPostId.trim();
    if (!postId || !Number.isInteger(amount) || amount < 1 || amount > 5000) {
      setSuccessToast('Enter a valid post ID and a whole number from 1 to 5000.');
      setTimeout(() => setSuccessToast(null), 2500);
      return;
    }

    await handleBoost(postId, boostReaction, amount);
  };

  const copyPostId = async (postId: string) => {
    try {
      await navigator.clipboard.writeText(postId);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 1800);
    } catch {
      setSuccessToast('Copy failed. Select the post ID manually.');
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const newId = await submitNewSchool(newSchoolName.trim(), newSchoolCity.trim() || '', newSchoolCountry.trim() || '');
    await approveSchool(newId, 'Directly approved by Website Creator');

    setNewSchoolName('');
    setNewSchoolCity('');
    setNewSchoolCountry('');
    setShowAddForm(false);
    setSuccessToast(`"${newSchoolName}" added directly to approved schools.`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#1a1216] border border-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-fade-in text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-[#161824] to-[#0e1017] border border-[#2b3144] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                Creator Authority
              </span>
              {pendingSchools.length > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-mono font-bold animate-pulse">
                  {pendingSchools.length} Pending
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-gothic font-bold text-slate-100 tracking-wide">
              SCHOOL REGISTRATION & APPROVAL
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              Review schools submitted by users. Approve them to add them to the active School Section, or decline petitions.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-[#181c28] hover:bg-[#23283a] text-xs font-semibold text-slate-200 border border-[#2f3548] flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-red-400" />
            <span>Add School Directly</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-5 border-t border-[#1f2434] text-center sm:text-left">
          <div className="p-3 sm:p-4 rounded-xl bg-[#11131c] border border-[#24293a]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Pending
            </span>
            <div className="text-xl sm:text-2xl font-bold font-gothic text-amber-400 mt-0.5">
              {pendingSchools.length}
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-[#11131c] border border-[#24293a]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Approved
            </span>
            <div className="text-xl sm:text-2xl font-bold font-gothic text-emerald-400 mt-0.5">
              {approvedSchools.length}
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-[#11131c] border border-[#24293a]">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Declined
            </span>
            <div className="text-xl sm:text-2xl font-bold font-gothic text-red-400 mt-0.5">
              {declinedSchools.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#232738] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141622]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approvals ({pendingSchools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'approved'
              ? 'bg-[#181b26] text-emerald-400 border border-emerald-800/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141622]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approved ({approvedSchools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('declined')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'declined'
              ? 'bg-[#181b26] text-red-400 border border-red-800/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141622]'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Declined ({declinedSchools.length})</span>
        </button>
      </div>

      {/* Direct Add Form */}
      {showAddForm && (
        <form onSubmit={handleCreateDirect} className="p-4 sm:p-5 rounded-xl bg-[#12141e] border border-[#2c3246] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-gothic font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-500" />
              <span>Direct School Entry</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Direct Approval</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="e.g. Cambridge Lyceum"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#161924] border border-[#2e3448] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={newSchoolCity}
                onChange={(e) => setNewSchoolCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#161924] border border-[#2e3448] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={newSchoolCountry}
                onChange={(e) => setNewSchoolCountry(e.target.value)}
                placeholder="Country"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#161924] border border-[#2e3448] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Add School
            </button>
          </div>
        </form>
      )}

      {/* Reaction Boost */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#12141f] border border-amber-900/50 shadow-lg space-y-4">
        <div>
          <h2 className="text-sm font-gothic font-bold text-amber-200">REACTION BOOST</h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Add one visible reaction to a post as Website Creator. Boosts do not create a fake user reaction.
          </p>
        </div>

        <form onSubmit={handleManualBoost} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px_150px_auto] gap-2 p-3 rounded-xl bg-[#0f1118] border border-[#24293a]">
          <input
            type="text"
            value={boostPostId}
            onChange={(e) => setBoostPostId(e.target.value)}
            placeholder="Paste post ID"
            aria-label="Post ID for reaction boost"
            className="min-w-0 px-3 py-2 rounded-lg bg-[#181b28] border border-[#2e3448] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-600"
          />
          <input
            type="number"
            min="1"
            max="5000"
            step="1"
            value={boostAmount}
            onChange={(e) => setBoostAmount(e.target.value)}
            aria-label="Reaction boost amount"
            className="px-3 py-2 rounded-lg bg-[#181b28] border border-[#2e3448] text-xs text-slate-100 focus:outline-none focus:border-amber-600"
          />
          <select
            value={boostReaction}
            onChange={(e) => setBoostReaction(e.target.value as keyof PostReactions)}
            aria-label="Reaction type for boost"
            className="px-3 py-2 rounded-lg bg-[#181b28] border border-[#2e3448] text-xs text-slate-100 focus:outline-none focus:border-amber-600"
          >
            <option value="like">👍 Like</option>
            <option value="love">❤️ Love</option>
            <option value="haha">😂 Haha</option>
            <option value="sad">😢 Sad</option>
            <option value="angry">😡 Angry</option>
          </select>
          <button
            type="submit"
            disabled={boostingPostId !== null}
            className="px-4 py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            Boost
          </button>
        </form>

        {posts.length === 0 ? (
          <p className="p-4 rounded-xl bg-[#0f1118] border border-[#24293a] text-xs text-slate-500 text-center">
            No posts available for boosting.
          </p>
        ) : (
          <div className="space-y-2.5">
            {posts.slice(0, 12).map((post) => (
              <div key={post.id} className="p-3 rounded-xl bg-[#0f1118] border border-[#24293a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono min-w-0">
                    <span className="truncate">ID: {post.id}</span>
                    <button
                      type="button"
                      onClick={() => copyPostId(post.id)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 shrink-0"
                      title="Copy post ID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {copiedPostId === post.id && <span className="text-emerald-400 shrink-0">Copied</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{post.authorName} • {post.schoolName}</div>
                  <p className="text-xs text-slate-200 line-clamp-2 mt-1">{post.caption || 'Image post'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {([
                    ['like', '👍'],
                    ['love', '❤️'],
                    ['haha', '😂'],
                    ['sad', '😢'],
                    ['angry', '😡'],
                  ] as [keyof PostReactions, string][]).map(([reactionType, emoji]) => (
                    <button
                      key={reactionType}
                      onClick={() => handleBoost(post.id, reactionType, 1)}
                      disabled={boostingPostId !== null}
                      className="px-2 py-1 rounded-lg bg-[#181b28] hover:bg-amber-950/60 border border-transparent hover:border-amber-700 text-xs text-slate-300 disabled:opacity-50 transition-colors"
                      title={`Boost ${reactionType}`}
                    >
                      <span>{emoji}</span>
                      <span className="font-mono text-[10px] ml-1">{post.reactions[reactionType]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingSchools.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0f1118] border border-[#212534] space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-200">
                No Pending School Registrations
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When users register an unlisted school name, it will appear here for your approval or decline.
              </p>
            </div>
          ) : (
            pendingSchools.map((school) => (
              <div
                key={school.id}
                className="p-5 rounded-2xl bg-[#12141f] border border-[#2d3348] shadow-lg space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-gothic font-bold text-slate-100">
                      {school.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      {(school.city || school.country) && (
                        <span>📍 {[school.city, school.country].filter(Boolean).join(', ')}</span>
                      )}
                      <span>Submitted by: <strong className="text-slate-200">{school.submittedByUserName}</strong></span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(school.id, school.name)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => handleDecline(school.id, school.name)}
                      className="px-3.5 py-2 rounded-lg bg-[#1f1719] hover:bg-red-950 border border-red-900/60 text-red-300 text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>

                {/* Optional note */}
                <div className="pt-2 border-t border-[#1d2130] flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewNotes[school.id] || ''}
                    onChange={(e) =>
                      setReviewNotes({ ...reviewNotes, [school.id]: e.target.value })
                    }
                    placeholder="Optional approval/decline note..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0d0e14] border border-[#232738] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* APPROVED TAB */}
      {activeTab === 'approved' && (
        <div className="space-y-3">
          {approvedSchools.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-[#0f1118] border border-[#212534] text-xs text-slate-400">
              No approved schools yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approvedSchools.map((school) => (
                <div
                  key={school.id}
                  className="p-4 rounded-xl bg-[#11131d] border border-[#252a3b] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-gothic font-bold text-slate-100 truncate">
                      {school.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {school.postCount} posts
                    </span>
                  </div>
                  {(school.city || school.country) && (
                    <p className="text-xs text-slate-400 truncate">
                      📍 {[school.city, school.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="pt-2 border-t border-[#1d2130] flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setActiveSchoolFilter(school.id);
                        setActiveView('feed');
                      }}
                      className="text-red-400 hover:text-red-300 font-semibold text-xs"
                    >
                      View Feed →
                    </button>

                    <button
                      onClick={async () => {
                        if (confirmDeleteId !== school.id) {
                          setConfirmDeleteId(school.id);
                          setTimeout(() => setConfirmDeleteId(null), 4000);
                          return;
                        }
                        await deleteSchool(school.id);
                        setConfirmDeleteId(null);
                        setSuccessToast(`Deleted "${school.name}".`);
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className={`px-2 py-1 rounded transition-colors text-[11px] flex items-center gap-1 ${
                        confirmDeleteId === school.id
                          ? 'bg-red-600 text-white font-bold animate-pulse'
                          : 'text-slate-500 hover:text-red-400 hover:bg-red-950/40'
                      }`}
                      title="Delete school campus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{confirmDeleteId === school.id ? 'Confirm?' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DECLINED TAB */}
      {activeTab === 'declined' && (
        <div className="space-y-3">
          {declinedSchools.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-[#0f1118] border border-[#212534] text-xs text-slate-400">
              No declined school submissions.
            </div>
          ) : (
            declinedSchools.map((school) => (
              <div
                key={school.id}
                className="p-4 rounded-xl bg-[#12141c] border border-red-950/60 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-gothic font-bold text-slate-300">{school.name}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {school.moderationNote || 'Declined'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(school.id, school.name)}
                    className="px-3 py-1.5 rounded bg-[#1e2230] hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 transition-colors text-[11px]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      if (confirmDeleteId !== school.id) {
                        setConfirmDeleteId(school.id);
                        setTimeout(() => setConfirmDeleteId(null), 4000);
                        return;
                      }
                      await deleteSchool(school.id);
                      setConfirmDeleteId(null);
                      setSuccessToast(`Deleted "${school.name}".`);
                      setTimeout(() => setSuccessToast(null), 3000);
                    }}
                    className={`px-2 py-1.5 rounded transition-colors text-[11px] flex items-center gap-1 ${
                      confirmDeleteId === school.id
                        ? 'bg-red-600 text-white font-bold animate-pulse'
                        : 'text-slate-500 hover:text-red-400 hover:bg-red-950/40'
                    }`}
                    title="Permanently remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
