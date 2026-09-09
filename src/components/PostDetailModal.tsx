import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhilippineDateTime } from '../utils/dateUtils';
import { 
  X, 
  Send, 
  EyeOff, 
  School as SchoolIcon,
  Clock
} from 'lucide-react';

export const PostDetailModal: React.FC = () => {
  const {
    selectedPost,
    setSelectedPost,
    currentUser,
    addComment,
    reactToPost,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(currentUser?.isAnonymous || false);
  const [commentError, setCommentError] = useState('');

  if (!selectedPost) return null;

  const userReaction = currentUser ? selectedPost.userReactions?.[currentUser.id] : undefined;
  const pht = formatPhilippineDateTime(selectedPost.createdAt);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError('');
    if (!commentText.trim()) return;

    if (!currentUser) return;

    const res = await addComment(selectedPost.id, commentText.trim(), isAnonymousComment);
    if (!res.success) {
      setCommentError(res.error || 'Failed to post reply');
      return;
    }
    setCommentText('');
  };

  const hasImage = Boolean(selectedPost.imageBase64);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className={`relative w-full ${hasImage ? 'max-w-4xl flex-col md:flex-row' : 'max-w-2xl flex-col'} bg-[#0f1118] border border-[#2b3044] rounded-2xl shadow-2xl overflow-hidden my-auto flex max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedPost(null)}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/70 hover:bg-red-950 text-slate-300 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: 500x500 Picture Display (Only if image attached) */}
        {hasImage && (
          <div className="md:w-1/2 bg-black flex flex-col items-center justify-center relative p-3 sm:p-4 border-b md:border-b-0 md:border-r border-[#202434] shrink-0">
            <div className="relative aspect-square w-full max-w-[380px] rounded-xl overflow-hidden border border-[#2d3246] shadow-xl">
              <img
                src={selectedPost.imageBase64}
                alt={selectedPost.caption || 'Post image'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 rounded-full bg-black/80 border border-red-900/60 text-slate-200 text-[10px] font-mono">
                  {selectedPost.tag}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Post Content, Author, Reactions, Comments */}
        <div className={`${hasImage ? 'md:w-1/2' : 'w-full'} flex flex-col justify-between bg-[#11131c] max-h-[75vh] md:max-h-[85vh] overflow-y-auto`}>
          
          {/* Post Header */}
          <div className="p-4 sm:p-5 border-b border-[#1f2334] space-y-3 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#3b4158] bg-black shrink-0">
                <img
                  src={selectedPost.authorAvatarBase64}
                  alt={selectedPost.authorName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {selectedPost.isAnonymous && (
                  <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                    <EyeOff className="w-3.5 h-3.5 text-red-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${selectedPost.isAnonymous ? 'text-red-300 font-mono' : 'text-slate-100 font-gothic'}`}>
                    {selectedPost.authorName}
                  </span>
                  {selectedPost.isAnonymous ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-bold">
                      COMPELLED (Identity Hidden)
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2232] text-emerald-300 border border-emerald-900/60 font-mono">
                      PUBLIC PROFILE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <SchoolIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{selectedPost.schoolName}</span>
                  {!selectedPost.isAnonymous && selectedPost.authorYear && (
                    <span className="text-slate-300 font-mono">• {selectedPost.authorYear}</span>
                  )}
                </div>
                
                {/* Philippine Standard Time Display */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-1" title={pht.full}>
                  <Clock className="w-3 h-3 text-red-400 shrink-0" />
                  <span>{pht.full}</span>
                  <span className="text-slate-600">({pht.relative})</span>
                </div>

                {!selectedPost.isAnonymous && selectedPost.authorBio && (
                  <p className="text-[11px] text-slate-400 italic mt-1 bg-[#131520] p-2 rounded-lg border border-[#212637]">
                    "{selectedPost.authorBio}"
                  </p>
                )}
              </div>
            </div>

            {/* Post Message / Caption */}
            {!hasImage ? (
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#151824] to-[#10121a] border border-[#24293a] my-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-950/70 border border-red-800/70 text-red-300 text-[10px] font-mono">
                    {selectedPost.tag}
                  </span>
                </div>
                <p className="font-serif italic text-base sm:text-lg text-slate-100 leading-relaxed">
                  “{selectedPost.caption}”
                </p>
              </div>
            ) : (
              selectedPost.caption && (
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                  {selectedPost.caption}
                </p>
              )
            )}

            {/* Reactions */}
            <div className="pt-2 border-t border-[#1d2130] flex items-center gap-2">
              <button
                onClick={() => reactToPost(selectedPost.id, 'blood')}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  userReaction === 'blood'
                    ? 'bg-red-950 text-red-300 border border-red-700 shadow-sm'
                    : 'bg-[#181b28] hover:bg-[#222738] text-slate-400'
                }`}
              >
                <span>🩸</span>
                <span className="font-mono text-xs">{selectedPost.reactions.blood}</span>
              </button>

              <button
                onClick={() => reactToPost(selectedPost.id, 'candle')}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  userReaction === 'candle'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-sm'
                    : 'bg-[#181b28] hover:bg-[#222738] text-slate-400'
                }`}
              >
                <span>🕯️</span>
                <span className="font-mono text-xs">{selectedPost.reactions.candle}</span>
              </button>

              <button
                onClick={() => reactToPost(selectedPost.id, 'skull')}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  userReaction === 'skull'
                    ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                    : 'bg-[#181b28] hover:bg-[#222738] text-slate-400'
                }`}
              >
                <span>💀</span>
                <span className="font-mono text-xs">{selectedPost.reactions.skull}</span>
              </button>

              <button
                onClick={() => reactToPost(selectedPost.id, 'rose')}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                  userReaction === 'rose'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700 shadow-sm'
                    : 'bg-[#181b28] hover:bg-[#222738] text-slate-400'
                }`}
              >
                <span>🥀</span>
                <span className="font-mono text-xs">{selectedPost.reactions.rose}</span>
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2.5">
            <div className="text-xs font-semibold text-slate-400">
              Comments ({selectedPost.comments?.length || 0})
            </div>

            {!selectedPost.comments || selectedPost.comments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No comments yet.
              </div>
            ) : (
              selectedPost.comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2.5 p-2 rounded-xl bg-[#0c0e15] border border-[#1d2130]">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#2e3448] bg-black shrink-0">
                    <img
                      src={comment.authorAvatarBase64}
                      alt={comment.authorName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {comment.isAnonymous && (
                      <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                        <EyeOff className="w-3 h-3 text-red-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${comment.isAnonymous ? 'text-red-300 font-mono' : 'text-slate-200'}`}>
                          {comment.authorName}
                        </span>
                        {comment.isAnonymous && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/60 font-mono">
                            COMPELLED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="p-3.5 border-t border-[#1f2334] bg-[#0e1017] space-y-2 shrink-0">
            {commentError && (
              <p className="text-[11px] text-red-400 font-medium px-1">
                {commentError}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] px-1">
              <label className="text-slate-400 font-medium">Reply as:</label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={isAnonymousComment}
                  onChange={(e) => setIsAnonymousComment(e.target.checked)}
                  className="w-3.5 h-3.5 accent-red-600 rounded"
                />
                <span className="text-[10px] font-mono">
                  {isAnonymousComment
                    ? currentUser?.anonymousNickname
                      ? `Compelled: ON (@${currentUser.anonymousNickname})`
                      : 'Compelled: ON (Nickname required)'
                    : 'Compelled: OFF (Public Reply)'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#151724] border border-[#292f42] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-600"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-red-900 hover:bg-red-800 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
