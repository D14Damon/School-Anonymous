import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isCreatorEmail } from '../utils/security';
import { 
  Building2, 
  Users, 
  Image as ImageIcon, 
  PlusCircle, 
  Search, 
  ArrowRight,
  Clock,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  X
} from 'lucide-react';
import { School } from '../types';

export const SchoolDirectory: React.FC = () => {
  const {
    approvedSchools,
    setActiveSchoolFilter,
    setActiveView,
    submitNewSchool,
    currentUser,
    setIsAuthModalOpen,
    switchSchool,
    schoolSwitchCooldown,
    getSchoolMemberCount,
  } = useApp();

  const [search, setSearch] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolCountry, setSchoolCountry] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

  // Transfer confirmation modal state
  const [transferTarget, setTransferTarget] = useState<School | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const filteredApproved = approvedSchools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase())) ||
      (s.country && s.country.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) return;

    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    submitNewSchool(schoolName.trim(), schoolCity.trim() || '', schoolCountry.trim() || '');
    setSchoolName('');
    setSchoolCity('');
    setSchoolCountry('');
    setShowRegisterForm(false);
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 5000);
  };

  const handleInitiateTransfer = (school: School) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setTransferError(null);
    setTransferTarget(school);
  };

  const handleConfirmTransfer = async () => {
    if (!transferTarget) return;
    setIsTransferring(true);
    setTransferError(null);

    const result = await switchSchool(transferTarget.id, transferTarget.name);
    setIsTransferring(false);

    if (result.success) {
      setActiveSchoolFilter(transferTarget.id);
      setActiveView('feed');
      setTransferSuccess(`Transferred to ${transferTarget.name} successfully! Feed updated.`);
      setTransferTarget(null);
      setTimeout(() => setTransferSuccess(null), 5000);
    } else {
      setTransferError(result.error || 'Failed to switch school.');
    }
  };

  const isCreator = isCreatorEmail(currentUser?.email);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      
      {/* Submitted Notice Banner */}
      {submittedNotice && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-600 text-amber-200 text-xs flex items-center gap-3 animate-fade-in shadow-xl">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>School Submitted:</strong> Your school registration was sent to the website creator for approval. Once approved, it will appear here in the School Section.
          </div>
        </div>
      )}

      {/* Transfer Success Notice */}
      {transferSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="block font-gothic tracking-wide">Campus Transfer Complete</strong>
              <span className="text-emerald-300/90">{transferSuccess}</span>
            </div>
          </div>
          <button 
            onClick={() => setTransferSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Affiliation & 30-Day Cooldown / Creator Exemption Status Banner */}
      {currentUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#11131e] border border-[#252a3f] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-950/70 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                  Your Current School
                </span>
                {currentUser.schoolName && (
                  <span className="px-2 py-0.2 rounded-full bg-red-950/80 text-red-300 text-[10px] font-mono border border-red-800/60">
                    Enrolled
                  </span>
                )}
                {currentUser.schoolId && currentUser.schoolId !== 'unassigned' && (
                  <span className="px-2 py-0.2 rounded-full bg-[#161a26] text-red-300 text-[10px] font-mono border border-[#2b334a] flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-red-400" />
                    <span>{getSchoolMemberCount(currentUser.schoolId)} {getSchoolMemberCount(currentUser.schoolId) === 1 ? 'member' : 'members'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-gothic font-bold text-slate-100">
                {currentUser.schoolName || 'Independent Scholar (No School Selected)'}
              </h3>
            </div>
          </div>

          {/* Cooldown Status Pill */}
          <div className="w-full sm:w-auto">
            {isCreator ? (
              <div className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-300 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px] font-mono text-amber-400">
                    CREATOR ACCOUNT
                  </span>
                  <span className="text-[11px] text-amber-200/90">
                    No Cooldown • Unlimited Instant Switching
                  </span>
                </div>
              </div>
            ) : schoolSwitchCooldown.canSwitch ? (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px] font-mono text-emerald-400">
                    TRANSFER AVAILABLE
                  </span>
                  <span className="text-[11px] text-emerald-200/90">
                    30-day cooldown begins after transfer
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px] font-mono text-red-400">
                    TRANSFER ON COOLDOWN
                  </span>
                  <span className="text-[11px] text-red-200/90">
                    {schoolSwitchCooldown.formattedRemaining}
                    {schoolSwitchCooldown.nextAvailableDate && 
                      ` (Eligible on ${schoolSwitchCooldown.nextAvailableDate.toLocaleDateString()})`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-2xl bg-[#11131c] border border-[#232738] shadow-xl">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-gothic font-bold text-slate-100 tracking-wide">
            SCHOOL DIRECTORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Browse approved schools, transfer your campus enrollment, or register a new school for creator approval.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-red-300" />
          <span>Register New School</span>
        </button>
      </div>

      {/* Register School Modal / Inset Form */}
      {showRegisterForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 rounded-2xl bg-[#141622] border border-[#2d3348] shadow-2xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#212638] pb-3">
            <div>
              <h3 className="text-sm font-gothic font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-500" />
                <span>Register a New School</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The website creator will review and approve your submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#0e1017] border border-[#2a2f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={schoolCity}
                onChange={(e) => setSchoolCity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#0e1017] border border-[#2a2f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={schoolCountry}
                onChange={(e) => setSchoolCountry(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#0e1017] border border-[#2a2f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold text-xs transition-colors"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      {approvedSchools.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved schools..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#11131c] border border-[#232738] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
          />
        </div>
      )}

      {/* Schools Grid / Empty State */}
      {filteredApproved.length === 0 ? (
        <div className="p-12 sm:p-16 text-center rounded-2xl bg-[#0f1118] border border-[#222736] space-y-4">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-gothic font-semibold text-slate-200">
              No Schools Listed Yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Register your school to start. Once approved by the creator, it will be displayed in this section.
            </p>
          </div>
          <button
            onClick={() => setShowRegisterForm(true)}
            className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white font-gothic text-xs font-semibold transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register School</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredApproved.map((school) => {
            const isEnrolled = currentUser?.schoolId === school.id;
            const canSwitch = isCreator || schoolSwitchCooldown.canSwitch;

            return (
              <div
                key={school.id}
                className={`group p-5 sm:p-6 rounded-2xl bg-[#11131d] border transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg ${
                  isEnrolled
                    ? 'border-red-700/80 bg-gradient-to-b from-[#141624] to-[#10121d]'
                    : 'border-[#252a3b] hover:border-red-700/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {isEnrolled && (
                        <span className="px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-700 text-[10px] font-mono font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-red-400" />
                          Enrolled
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono">
                        Approved
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-gothic font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                      {school.name}
                    </h3>
                    {(school.city || school.country) && (
                      <p className="text-xs text-slate-400 mt-1">
                        📍 {[school.city, school.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e2332] text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-red-500" />
                      <span>{getSchoolMemberCount(school.id)} {getSchoolMemberCount(school.id) === 1 ? 'Member' : 'Members'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                      <span>{school.postCount} Posts</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setActiveSchoolFilter(school.id);
                      setActiveView('feed');
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-[#181c28] hover:bg-red-950 hover:text-red-200 border border-[#2b3144] hover:border-red-800/80 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>View School Feed</span>
                    <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                  </button>

                  {/* Switch to This School button */}
                  {!isEnrolled && (
                    <button
                      onClick={() => handleInitiateTransfer(school)}
                      disabled={!canSwitch}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        canSwitch
                          ? isCreator
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-700/60 shadow-sm'
                            : 'bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-700/50 shadow-sm'
                          : 'bg-[#141620] text-slate-500 border border-[#222636] cursor-not-allowed opacity-75'
                      }`}
                    >
                      {canSwitch ? (
                        <>
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>
                            {isCreator ? 'Instant Switch (Creator)' : 'Switch to This School'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-red-400" />
                          <span>Cooldown Active ({schoolSwitchCooldown.formattedRemaining})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* School Transfer Confirmation Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#11131f] border border-[#30364d] rounded-2xl shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-[#23283a] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-950/70 text-red-400 border border-red-800/60">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <h3 className="font-gothic font-bold text-slate-100 text-base">
                  Confirm School Transfer
                </h3>
              </div>
              <button
                onClick={() => setTransferTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1e2b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#161826] border border-[#2b3146] space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-400">Target Academy</div>
                <div className="text-sm font-gothic font-bold text-slate-100">
                  {transferTarget.name}
                </div>
                {(transferTarget.city || transferTarget.country) && (
                  <div className="text-[11px] text-slate-400">
                    📍 {[transferTarget.city, transferTarget.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* Policy Explanation */}
              {isCreator ? (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-200 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-300">Creator Exemption Active</span>
                    <span>
                      As the platform creator, your account has zero cooldown. You can switch schools freely anytime without waiting 30 days.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-300">30-Day Transfer Policy</span>
                    <span>
                      Every student can switch school, but transferring initiates a strict <strong>30-day cooldown</strong>. You will not be able to switch to another academy until 30 days have elapsed.
                    </span>
                  </div>
                </div>
              )}

              {transferError && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-600 text-red-200 text-xs">
                  {transferError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTransferTarget(null)}
                disabled={isTransferring}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1a1e2b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isTransferring}
                className="px-5 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white font-gothic text-xs font-semibold tracking-wide transition-all shadow-lg flex items-center gap-2"
              >
                {isTransferring ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transferring...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Confirm Transfer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
