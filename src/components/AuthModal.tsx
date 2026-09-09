import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { processImageToBase64_500x500 } from '../utils/imageUtils';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff, 
  School as SchoolIcon, 
  Upload, 
  AlertCircle, 
  Loader2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    approvedSchools,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'google'>('register');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [schoolChoice, setSchoolChoice] = useState<string>(approvedSchools[0]?.id || 'new');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [regAnonymous, setRegAnonymous] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [avatarPreviewLoading, setAvatarPreviewLoading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (schoolChoice !== 'new' && !approvedSchools.some((school) => school.id === schoolChoice)) {
      setSchoolChoice(approvedSchools[0]?.id || 'new');
    }
  }, [approvedSchools, schoolChoice]);

  if (!isAuthModalOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarPreviewLoading(true);
      const base64_500 = await processImageToBase64_500x500(file);
      setAvatarBase64(base64_500);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image to 500x500 Base64');
    } finally {
      setAvatarPreviewLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Email and password are required');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithEmail(loginEmail, loginPassword);
    setIsLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setErrorMsg(res.error || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Name, email, and password are required');
      return;
    }

    if (schoolChoice === 'new' && !newSchoolName.trim()) {
      setErrorMsg('Please enter your school name');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const res = await registerWithEmail({
      name: regName.trim(),
      email: regEmail.trim(),
      pass: regPassword,
      schoolId: schoolChoice,
      newSchoolName: schoolChoice === 'new' ? newSchoolName.trim() : undefined,
      avatarBase64: avatarBase64 || undefined,
      isAnonymous: regAnonymous,
    });
    setIsLoading(false);

    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  const handleGoogleConnect = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setErrorMsg(res.error || 'Google Sign-In failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#0e1017] border border-[#2c3144] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ornate Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-600 to-rose-950 shrink-0"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1f2332] shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-gothic font-bold text-slate-100 tracking-wider">
              {activeTab === 'register' ? 'CREATE ACCOUNT' : activeTab === 'login' ? 'SIGN IN' : 'GMAIL CONNECT'}
            </h2>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1e2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Tabs */}
        <div className="grid grid-cols-3 border-b border-[#1f2332] bg-[#0a0b0e] text-xs font-semibold uppercase tracking-wider shrink-0">
          <button
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#141620] text-red-400 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-[#141620] text-red-400 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('google');
              setErrorMsg('');
            }}
            className={`py-3 text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-[#141620] text-red-400 border-b-2 border-red-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-red-500 font-bold">G</span>
            <span>Gmail</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Profile Photo 500x500 Base64 upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Profile Picture (500×500)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#2e3346] bg-[#12141c] flex items-center justify-center shrink-0">
                    {avatarPreviewLoading ? (
                      <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                    ) : avatarBase64 ? (
                      <img
                        src={avatarBase64}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                        <span className="text-[9px] text-slate-500 block">500×500</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFile}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#23283a] text-xs font-medium text-slate-200 border border-[#2d3348] transition-colors"
                    >
                      {avatarBase64 ? 'Change Picture' : 'Upload Picture'}
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Standardized to 500×500 Base64 string for database storage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* School Section */}
              <div className="space-y-2 pt-1 border-t border-[#1b1e2a]">
                <label className="block text-xs font-semibold text-slate-300">
                  School Selection *
                </label>
                
                {approvedSchools.length > 0 && (
                  <div className="space-y-1">
                    <select
                      value={schoolChoice}
                      onChange={(e) => setSchoolChoice(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-200 focus:outline-none focus:border-red-600"
                    >
                      {approvedSchools.map((sch) => (
                        <option key={sch.id} value={sch.id}>
                          {sch.name} {sch.city ? `(${sch.city})` : ''}
                        </option>
                      ))}
                      <option value="new">+ Register a new school</option>
                    </select>
                  </div>
                )}

                {/* If no schools yet or user selected 'new' */}
                {(approvedSchools.length === 0 || schoolChoice === 'new') && (
                  <div className="p-3 rounded-xl bg-[#12141d] border border-[#232736] space-y-2">
                    <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                      <SchoolIcon className="w-3.5 h-3.5 text-red-400" />
                      <span>Register School Name for Creator Approval:</span>
                    </span>
                    <input
                      type="text"
                      required={approvedSchools.length === 0 || schoolChoice === 'new'}
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="e.g. Oxford Gothic Academy"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0c0e14] border border-[#2a2f42] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-600"
                    />
                    <p className="text-[11px] text-slate-400 leading-tight">
                      When registered, the Website Creator will review and approve it. Once approved, it will be added to the School Section.
                    </p>
                  </div>
                )}
              </div>

              {/* Anonymous Button / Toggle (User requirement) */}
              <div className="p-3 rounded-xl bg-[#13151f] border border-[#232736] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {regAnonymous ? (
                      <EyeOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-semibold text-slate-200">
                      Hide Profile (Anonymous Mode)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hides your real name and profile picture on posts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRegAnonymous(!regAnonymous)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    regAnonymous ? 'bg-red-700' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      regAnonymous ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>Register Account</span>
                )}
              </button>
            </form>
          )}

          {/* SIGN IN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#282d3e] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* GOOGLE / GMAIL TAB */}
          {activeTab === 'google' && (
            <div className="space-y-4 py-2 text-center">
              <p className="text-xs text-slate-300">
                Sign in or register directly using your Gmail / Google Account.
              </p>

              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Connect with Gmail'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
