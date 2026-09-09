import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';
import logoImg from '../assets/images/gothic_school_logo_1788974588737.jpg';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAnonymousDefault, setIsAnonymousDefault] = useState(false);
  const [anonymousNickname, setAnonymousNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials');
        if (res.error?.includes('locked')) {
          setLockoutTimer(60);
          const interval = setInterval(() => {
            setLockoutTimer((prev) => {
              if (!prev || prev <= 1) {
                clearInterval(interval);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } else {
      if (!name.trim()) {
        setErrorMessage('Name is required');
        setLoading(false);
        return;
      }
      if (isAnonymousDefault && !anonymousNickname.trim()) {
        setErrorMessage('Please provide a unique nickname for your Compelled profile.');
        setLoading(false);
        return;
      }
      const res = await registerWithEmail({
        name: name.trim(),
        email: email.trim(),
        pass: password,
        isAnonymous: isAnonymousDefault,
        anonymousNickname: anonymousNickname.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed');
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setErrorMessage(res.error || 'Google connection failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Gothic Ambient Glow & Security Mesh Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-slate-900/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Security Authentication Box */}
      <div className="relative w-full max-w-md bg-[#0f1118]/95 border border-[#2b3145] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden z-10">
        
        {/* Top Filigree Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-600 to-rose-950"></div>

        {/* Security Portal Header */}
        <div className="px-6 pt-6 pb-4 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden border-2 border-red-900/60 shadow-lg p-0.5 bg-[#0a0c12]">
            <img
              src={logoImg}
              alt="School Anonymous"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-gothic font-bold text-slate-100 tracking-wider">
              SCHOOL ANONYMOUS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate to enter the campus network
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#090b10] border border-[#202534] text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-red-950 text-red-200 shadow-sm border border-red-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-red-950 text-red-200 shadow-sm border border-red-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 pt-1">
          
          {/* Error / Rate limit lockout alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-700 text-red-200 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {lockoutTimer !== null && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-700 text-amber-200 text-xs flex items-center gap-2 animate-fade-in">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Brute force lockout active. Wait {lockoutTimer}s.</span>
            </div>
          )}

          {/* Quick Connect with Gmail (Google Provider) */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading || lockoutTimer !== null}
            className="w-full py-2.5 px-4 rounded-xl bg-[#141724] hover:bg-[#1a1f30] border border-[#2e344a] text-slate-100 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm hover:border-red-600/60 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 6.4 10.4 6.4z"
              />
            </svg>
            <span>Connect with Gmail</span>
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#141622] border border-[#2b3145] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#141622] border border-[#2b3145] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-[#141622] border border-[#2b3145] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#131520] border border-[#232838] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymousDefault}
                    onChange={(e) => setIsAnonymousDefault(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <div className="text-xs">
                    <span className="text-slate-200 font-semibold block">
                      Activate Compelled Mode
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hides all identity & profile details. When off, shows all details about you.
                    </span>
                  </div>
                </label>

                {isAnonymousDefault && (
                  <div className="p-3 rounded-xl bg-[#11131c] border border-red-950/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-200">
                        Compelled Unique Nickname *
                      </label>
                      <span className="text-[10px] font-mono text-red-400">UNIQUE ALIAS</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-mono text-xs font-bold">@</span>
                      <input
                        type="text"
                        required={isAnonymousDefault}
                        value={anonymousNickname}
                        onChange={(e) => setAnonymousNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-[#141622] border border-[#2b3145] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Every user using Compelled mode must provide a unique nickname (letters, numbers, hyphens, or underscores).
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockoutTimer !== null}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
