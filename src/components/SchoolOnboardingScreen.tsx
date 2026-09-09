import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isCreatorEmail } from '../utils/security';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  LogOut,
  Sparkles,
  Users
} from 'lucide-react';
import logoImg from '../assets/images/gothic_school_logo_1788974588737.jpg';

export const SchoolOnboardingScreen: React.FC = () => {
  const { 
    currentUser, 
    approvedSchools, 
    selectUserSchool, 
    submitNewSchool, 
    logout,
    getSchoolMemberCount
  } = useApp();

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);

  // Form fields for registering a new school
  const [newSchoolName, setNewSchoolName] = useState<string>('');
  const [newSchoolCity, setNewSchoolCity] = useState<string>('');
  const [newSchoolCountry, setNewSchoolCountry] = useState<string>('');
  
  // Status after submission
  const [submittedSchoolName, setSubmittedSchoolName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentUser) return null;

  const filteredApproved = approvedSchools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase())) ||
      (s.country && s.country.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectExisting = async () => {
    if (!selectedSchoolId) return;
    const match = approvedSchools.find((s) => s.id === selectedSchoolId);
    if (!match) return;

    await selectUserSchool(match.id, match.name);
  };

  const handleRegisterNewSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setIsSubmitting(true);
    const createdId = await submitNewSchool(
      newSchoolName.trim(), 
      newSchoolCity.trim() || '', 
      newSchoolCountry.trim() || ''
    );

    // Assign user to this pending school
    await selectUserSchool(createdId, newSchoolName.trim());
    setSubmittedSchoolName(newSchoolName.trim());
    setIsSubmitting(false);
  };

  const handleEnterCreator = async () => {
    await selectUserSchool('creator-hq', 'Website Creator Council');
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative w-full max-w-2xl bg-[#0f1118]/95 border border-[#2b3145] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Filigree Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-600 to-rose-950 shrink-0"></div>

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1f2334] shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#30374e] p-0.5 bg-[#0a0c12] shrink-0">
              <img
                src={logoImg}
                alt="Logo"
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest block">
                Welcome, {currentUser.name}
              </span>
              <h1 className="text-lg sm:text-xl font-gothic font-bold text-slate-100 tracking-wide">
                CHOOSE YOUR SCHOOL
              </h1>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262c3e] hover:border-red-800 transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Body Container (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Creator Bypass Option */}
          {isCreatorEmail(currentUser?.email) && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="text-amber-200 block">Website Creator Detected</strong>
                  <span className="text-slate-400 text-[11px]">
                    You have executive authority over all schools and submissions.
                  </span>
                </div>
              </div>
              <button
                onClick={handleEnterCreator}
                className="px-3.5 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-800 text-white font-semibold text-xs transition-colors shrink-0"
              >
                Enter as Creator
              </button>
            </div>
          )}

          {/* Submission Success State */}
          {submittedSchoolName ? (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-700/60 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-gothic font-bold text-slate-100">
                  School Submitted for Approval!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your registration for <strong>"{submittedSchoolName}"</strong> has been forwarded to the Website Creator. You are now enlisted under this school. Once approved, it will appear publicly on the approved school list.
                </p>
              </div>

              <button
                onClick={() => {
                  // User already has schoolId updated in handleRegisterNewSchool
                  // Refresh or trigger next render
                  window.location.reload();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-gothic text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2"
              >
                <span>Enter School Anonymous</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* SECTION A: Select from Approved Schools */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-200">
                    Select from Approved Schools
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {approvedSchools.length} approved schools available
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search schools by name, city, or country..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#121420] border border-[#272d40] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* School List */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                  {filteredApproved.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#11131c] border border-[#212638] text-xs text-slate-400 space-y-1">
                      <p>No matching approved schools found.</p>
                      <p className="text-[11px] text-slate-500">
                        Use the option below to register your school.
                      </p>
                    </div>
                  ) : (
                    filteredApproved.map((school) => {
                      const isSelected = selectedSchoolId === school.id;
                      return (
                        <div
                          key={school.id}
                          onClick={() => setSelectedSchoolId(school.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-red-950/60 border-red-700 text-white shadow-md'
                              : 'bg-[#11131c] border-[#222736] hover:border-[#32394e] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-900 text-white' : 'bg-[#181c28] text-slate-400'}`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs block truncate">
                                {school.name}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {(school.city || school.country) && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    📍 {[school.city, school.country].filter(Boolean).join(', ')}
                                  </span>
                                )}
                                <span className="text-[10px] text-red-400/90 font-mono flex items-center gap-1">
                                  <Users className="w-2.5 h-2.5" />
                                  <span>{getSchoolMemberCount(school.id)} {getSchoolMemberCount(school.id) === 1 ? 'member' : 'members'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Confirm Button if school selected */}
                {selectedSchoolId && (
                  <button
                    type="button"
                    onClick={handleSelectExisting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Confirm & Enter School Anonymous</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* SECTION B: Register New School if not listed */}
              <div className="pt-4 border-t border-[#1f2434] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      School Not on the List?
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Register your school name for creator review and approval.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                    className="px-3 py-1.5 rounded-lg bg-[#191d2c] hover:bg-[#22283c] border border-[#2e354a] text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>{showRegisterForm ? 'Cancel' : 'Register School'}</span>
                  </button>
                </div>

                {/* Register School Inset Form */}
                {showRegisterForm && (
                  <form
                    onSubmit={handleRegisterNewSchool}
                    className="p-4 rounded-xl bg-[#131622] border border-[#2b3145] space-y-3 animate-fade-in"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-gothic font-bold text-slate-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Register New School</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Once registered and approved by the website creator, your school will appear on the school list.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          School Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSchoolName}
                          onChange={(e) => setNewSchoolName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0e1017] border border-[#292f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          City / Region
                        </label>
                        <input
                          type="text"
                          value={newSchoolCity}
                          onChange={(e) => setNewSchoolCity(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0e1017] border border-[#292f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={newSchoolCountry}
                          onChange={(e) => setNewSchoolCountry(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#0e1017] border border-[#292f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRegisterForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <span>{isSubmitting ? 'Submitting...' : 'Submit for Creator Approval'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
