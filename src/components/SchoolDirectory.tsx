import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Users, 
  Image as ImageIcon, 
  PlusCircle, 
  Search, 
  ArrowRight,
  Clock
} from 'lucide-react';

export const SchoolDirectory: React.FC = () => {
  const {
    approvedSchools,
    setActiveSchoolFilter,
    setActiveView,
    submitNewSchool,
    currentUser,
    setIsAuthModalOpen,
  } = useApp();

  const [search, setSearch] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [schoolCountry, setSchoolCountry] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);

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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-2xl bg-[#11131c] border border-[#232738] shadow-xl">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-gothic font-bold text-slate-100 tracking-wide">
            SCHOOL DIRECTORY
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Browse approved schools or register a new school for creator approval.
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
          {filteredApproved.map((school) => (
            <div
              key={school.id}
              className="group p-5 sm:p-6 rounded-2xl bg-[#11131d] border border-[#252a3b] hover:border-red-700/60 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono">
                    Approved
                  </span>
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
                    <span>{school.studentCount} Members</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>{school.postCount} Posts</span>
                  </div>
                </div>
              </div>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
