import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { processImageToBase64_500x500 } from '../utils/imageUtils';
import { 
  X, 
  Upload, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  School as SchoolIcon,
  Loader2
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    currentUser,
    isProfileModalOpen,
    setIsProfileModalOpen,
    updateProfile,
    checkNicknameAvailability,
    posts,
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [year, setYear] = useState(currentUser?.year || '');
  const [avatarBase64, setAvatarBase64] = useState(currentUser?.avatarBase64 || '');
  const [isAnonymous, setIsAnonymous] = useState(currentUser?.isAnonymous || false);
  const [anonymousNickname, setAnonymousNickname] = useState(currentUser?.anonymousNickname || '');
  
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCheckingNick, setIsCheckingNick] = useState(false);
  const [nickCheckResult, setNickCheckResult] = useState<{ available?: boolean; message?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isProfileModalOpen || !currentUser) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImg(true);
      const base64_500 = await processImageToBase64_500x500(file);
      setAvatarBase64(base64_500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingImg(false);
    }
  };

  const verifyNickname = async (candidate: string) => {
    const clean = candidate.trim();
    if (!clean) {
      setNickCheckResult(null);
      return;
    }
    setIsCheckingNick(true);
    const res = await checkNicknameAvailability(clean, currentUser.id);
    setIsCheckingNick(false);
    if (res.available) {
      setNickCheckResult({ available: true, message: `@${clean} is unique and available!` });
    } else {
      setNickCheckResult({ available: false, message: res.error || 'Nickname is already taken.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isAnonymous && !anonymousNickname.trim()) {
      setErrorMessage('A unique Compelled nickname is required when Compelled mode is ON.');
      return;
    }

    const res = await updateProfile({
      name: name.trim() || currentUser.name,
      bio: bio.trim(),
      year: year.trim(),
      avatarBase64: avatarBase64 || currentUser.avatarBase64,
      isAnonymous,
      anonymousNickname: anonymousNickname.trim(),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update profile');
      return;
    }

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const userPosts = posts.filter((p) => p.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#0f1118] border border-[#2b3044] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Filigree Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-600 to-rose-950 shrink-0"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1f2334] shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-gothic font-bold text-slate-100 tracking-wider">
              EDIT PROFILE
            </h2>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1e2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Avatar & Anonymous Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#131520] border border-[#252a3b]">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#373d52] bg-[#0c0d12] shrink-0">
                  <img
                    src={avatarBase64 || currentUser.avatarBase64}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {currentUser.isAnonymous && (
                    <div className="absolute inset-0 bg-red-950/75 flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-red-300" />
                    </div>
                  )}
                  {isProcessingImg && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImg}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1d2b] hover:bg-[#252a3d] text-xs font-semibold text-slate-200 border border-[#32384f] transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-red-400" />
                    <span>Upload Picture (500×500)</span>
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Stored as 500×500 Base64 string.
                  </p>
                </div>
              </div>

              {/* Compelled Toggle Button (User requirement) */}
              <div className="border-t sm:border-t-0 sm:border-l border-[#24293c] pt-3 sm:pt-0 sm:pl-4 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  Identity Protection
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAnonymous(!isAnonymous);
                    setErrorMessage('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isAnonymous
                      ? 'bg-red-950 text-red-200 border border-red-700 shadow-md ring-1 ring-red-500/40'
                      : 'bg-[#181c28] text-slate-300 border border-[#2c3246] hover:border-slate-500'
                  }`}
                >
                  {isAnonymous ? (
                    <>
                      <EyeOff className="w-4 h-4 text-red-400" />
                      <span className="font-bold">Compelled: ON</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span>Compelled: OFF</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isAnonymous ? 'Hides all identity & profile' : 'Shows all user details'}
                </span>
              </div>
            </div>

            {/* Visibility Mode Banner */}
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
              isAnonymous 
                ? 'bg-red-950/40 border-red-800/80 text-red-200' 
                : 'bg-[#121622] border-[#252f48] text-slate-300'
            }`}>
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isAnonymous ? 'bg-red-900/60 text-red-300' : 'bg-[#1a2030] text-emerald-400'}`}>
                {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="font-bold flex items-center gap-2">
                  <span>{isAnonymous ? 'Compelled Mode Active: Identity & Profile Hidden' : 'Compelled Mode Inactive: Full Public Profile'}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isAnonymous ? 'bg-red-900 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
                    {isAnonymous ? 'HIDDEN' : 'PUBLIC'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {isAnonymous
                    ? 'When Compelled is ON, all your personal details (real name, uploaded picture, class year, and bio) are completely hidden from other users. Only your unique @nickname is shown.'
                    : 'When Compelled is OFF, all details about you are shown: other scholars can see your real name, uploaded picture, school, class year, and bio.'}
                </p>
              </div>
            </div>

            {/* Unique Compelled Nickname Card */}
            <div className={`p-4 rounded-xl border transition-all ${
              isAnonymous 
                ? 'bg-[#14121a] border-red-800/80 shadow-lg' 
                : 'bg-[#12141e] border-[#25293b]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Compelled Unique Nickname {isAnonymous && <span className="text-red-400">*</span>}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Required unique alias shown instead of your identity when Compelled is ON.
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isAnonymous 
                    ? 'bg-red-950 text-red-300 border-red-700' 
                    : 'bg-[#1a1d2c] text-slate-400 border-[#2f354a]'
                }`}>
                  {isAnonymous ? 'COMPELLED ON' : 'COMPELLED OFF'}
                </span>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    required={isAnonymous}
                    value={anonymousNickname}
                    onChange={(e) => {
                      setAnonymousNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''));
                      setNickCheckResult(null);
                      setErrorMessage('');
                    }}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl bg-[#0e1017] border border-[#2b3145] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => verifyNickname(anonymousNickname)}
                  disabled={isCheckingNick || !anonymousNickname.trim()}
                  className="px-3 py-2 rounded-xl bg-[#1b1f2d] hover:bg-[#252b3d] border border-[#32394e] text-slate-300 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  {isCheckingNick && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />}
                  <span>Check Availability</span>
                </button>
              </div>

              {nickCheckResult && (
                <div className={`mt-2 text-[11px] flex items-center gap-1.5 ${
                  nickCheckResult.available ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {nickCheckResult.available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>{nickCheckResult.message}</span>
                </div>
              )}
            </div>

            {/* Name, School, Standing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Name *
                  </label>
                  <span className={`text-[10px] font-mono ${isAnonymous ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isAnonymous ? 'Hidden (Compelled)' : 'Visible (Public)'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#2b3042] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Class Year / Grade
                  </label>
                  <span className={`text-[10px] font-mono ${isAnonymous ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isAnonymous ? 'Hidden (Compelled)' : 'Visible (Public)'}
                  </span>
                </div>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#2b3042] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* School Affiliation */}
            <div className="p-3 rounded-xl bg-[#13151f] border border-[#252a3b] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-red-950/60 text-red-400">
                  <SchoolIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Enrolled School
                  </span>
                  <span className="font-bold text-slate-200">
                    {currentUser.schoolName || 'Independent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Bio
                </label>
                <span className={`text-[10px] font-mono ${isAnonymous ? 'text-red-400' : 'text-emerald-400'}`}>
                  {isAnonymous ? 'Hidden (Compelled)' : 'Visible (Public)'}
                </span>
              </div>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share about yourself..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#141620] border border-[#2b3042] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 resize-none"
              />
            </div>

            {/* Submit & Status */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#1f2334]">
              {isSavedNotice ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Profile updated!</span>
                </div>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border border-red-700/80 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>

          {/* User's Post History */}
          {userPosts.length > 0 && (
            <div className="pt-3 border-t border-[#1f2334]">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                My Posts ({userPosts.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {userPosts.map((p) => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden border border-[#2c3144] aspect-square">
                    <img
                      src={p.imageBase64}
                      alt="Post"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-[10px] text-white">
                      <span className="truncate font-semibold">{p.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
