import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { isCreatorEmail } from '../utils/security';
import { processImageToBase64_500x500 } from '../utils/imageUtils';
import { PostTag } from '../types';
import { 
  X, 
  EyeOff, 
  Eye, 
  Send, 
  School as SchoolIcon, 
  AlertCircle,
  Camera,
  Loader2
} from 'lucide-react';

const TAGS: PostTag[] = [
  'Confessions',
  'Shoutouts',
  'ngl / tbh / fr',
  'Rants & Vent',
  'Questions & Curious',
  'Appreciation',
];

export const CreatePostModal: React.FC = () => {
  const {
    currentUser,
    approvedSchools,
    isCreatePostModalOpen,
    setIsCreatePostModalOpen,
    createPost,
  } = useApp();

  const [imageBase64, setImageBase64] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [tag, setTag] = useState<PostTag>('Confessions');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(currentUser?.isAnonymous || false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isCreator = isCreatorEmail(currentUser?.email);
  const hasApprovedSchool = approvedSchools.length > 0 &&
    Boolean(currentUser?.schoolId && currentUser.schoolId !== 'unassigned' && approvedSchools.some((s) => s.id === currentUser.schoolId));
  const canPost = approvedSchools.length > 0 && (isCreator || hasApprovedSchool);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreatePostModalOpen || !currentUser) return null;

  const handleFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMsg('');
      const base64_500 = await processImageToBase64_500x500(file);
      setImageBase64(base64_500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process image to 500x500 Base64');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) {
      setErrorMsg('You cannot publish a post without belonging to an approved school.');
      return;
    }

    if (!caption.trim() && !imageBase64) {
      setErrorMsg('Please write some text or upload a picture.');
      return;
    }

    if (isAnonymous && !currentUser.anonymousNickname) {
      setErrorMsg('A unique Compelled nickname is required before publishing in Compelled mode. Please configure it in your Profile.');
      return;
    }

    const res = await createPost({
      imageBase64: imageBase64 || undefined,
      caption: caption.trim(),
      tag,
      isAnonymous,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to publish post');
      return;
    }

    setIsCreatePostModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#0f1118] border border-[#2b3145] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-600 to-rose-950 shrink-0"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1f2334] shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-gothic font-bold text-slate-100 tracking-wider">
              NEW POST
            </h2>
          </div>
          <button
            onClick={() => setIsCreatePostModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1e2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Caption / Text Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200">
                Post Text / Message
              </label>
              <span className="text-[10px] text-slate-400">
                {caption.length}/1500
              </span>
            </div>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Inscribe your confession, rant, question, or thought..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#131622] border border-[#2b3144] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600 resize-none leading-relaxed"
            />
          </div>

          {/* Picture Upload Area (Optional 500x500 Base64) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Attached Photo <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              {imageBase64 && (
                <button
                  type="button"
                  onClick={() => setImageBase64('')}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              )}
            </div>

            {imageBase64 ? (
              <div className="relative group rounded-xl overflow-hidden border border-[#373e54] aspect-square max-w-[200px] mx-auto bg-black shadow-lg">
                <img
                  src={imageBase64}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-medium"
                  >
                    Change Picture
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageBase64('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-300 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-[#282d3e] hover:border-red-600/70 rounded-xl p-3.5 text-center bg-[#12141e] hover:bg-[#151824] transition-colors flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-slate-200 block">
                    Add a photo <span className="text-slate-500 font-normal text-[11px]">(Optional)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Upload image to format as 500×500 Base64
                  </span>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    tag === t
                      ? 'bg-red-900 text-white border border-red-700 shadow-sm'
                      : 'bg-[#151722] text-slate-400 hover:text-slate-200 border border-[#25293a]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Compelled Toggle Button (User requirement) */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isAnonymous 
              ? 'bg-red-950/40 border-red-800/80 shadow-md' 
              : 'bg-[#12141f] border-[#272d3f]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg ${isAnonymous ? 'bg-red-950 text-red-300' : 'bg-[#1c202d] text-slate-400'}`}>
                  {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Compelled
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isAnonymous ? 'bg-red-800 text-white font-bold' : 'bg-[#212638] text-slate-400'
                    }`}>
                      {isAnonymous ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    {isAnonymous
                      ? `Hides identity & profile. Publishing under @${currentUser.anonymousNickname || 'Compelled'}`
                      : 'Shows all details (real name, profile photo, school, class year & bio)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isAnonymous
                    ? 'bg-red-900 hover:bg-red-800 text-white border-red-700 shadow-sm'
                    : 'bg-[#1a1e2d] hover:bg-[#252b3d] text-slate-300 border-[#32394e]'
                }`}
              >
                {isAnonymous ? 'Compelled: ON' : 'Compelled: OFF'}
              </button>
            </div>
          </div>

          {/* School Affiliation */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
            <SchoolIcon className="w-3.5 h-3.5 text-red-500" />
            <span>School: <strong>{currentUser.schoolName || 'Unassigned'}</strong></span>
          </div>

          {!canPost && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>You cannot post yet because your school has not been approved or you do not belong to an approved school.</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isProcessing || !canPost}
            className={`w-full py-3 rounded-xl border text-white font-gothic text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
              canPost
                ? 'bg-gradient-to-r from-red-900 to-rose-950 hover:from-red-800 hover:to-rose-900 border-red-700/80'
                : 'bg-[#181a24] text-slate-500 border-[#2b3042] cursor-not-allowed opacity-60'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Post</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
