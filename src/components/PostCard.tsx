import React from 'react';
import { Post } from '../types';
import { useApp } from '../context/AppContext';
import { formatPhilippineDateTime } from '../utils/dateUtils';
import { 
  MessageSquare, 
  EyeOff, 
  School as SchoolIcon, 
  Maximize2,
  Clock
} from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { reactToPost, setSelectedPost, currentUser } = useApp();

  const userReaction = currentUser ? post.userReactions[currentUser.id] : undefined;
  const pht = formatPhilippineDateTime(post.createdAt);

  return (
    <article className="group bg-[#11131c] border border-[#232738] hover:border-red-900/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col justify-between">
      
      {/* Card Header: Author, Profile Picture, Anonymity Status, School */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-[#1b1e2c]">
        <div className="flex items-center space-x-3 min-w-0">
          
          {/* Profile Picture (500x500 Base64 or Veiled) */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#373d52] shrink-0 bg-black">
            <img
              src={post.authorAvatarBase64}
              alt={post.authorName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {post.isAnonymous && (
              <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center">
                <EyeOff className="w-3.5 h-3.5 text-red-300" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold truncate ${post.isAnonymous ? 'text-red-300 font-mono' : 'text-slate-100 font-gothic'}`}>
                {post.authorName}
              </span>
              {post.isAnonymous ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/80 font-mono tracking-wider font-bold">
                  COMPELLED
                </span>
              ) : post.authorYear ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1c2232] text-slate-300 border border-[#2b354c] font-mono">
                  {post.authorYear}
                </span>
              ) : null}
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
              <SchoolIcon className="w-3 h-3 text-red-500 shrink-0" />
              <span className="truncate">{post.schoolName}</span>
            </div>
          </div>
        </div>

        {/* Philippine Standard Time & Date */}
        <div className="text-right shrink-0" title={pht.full}>
          <div className="text-[10px] font-mono text-slate-300 font-semibold flex items-center justify-end gap-1">
            <Clock className="w-2.5 h-2.5 text-red-400" />
            <span>{pht.time}</span>
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {pht.date}
          </div>
        </div>
      </div>

      {/* Post Image Container (if attached) */}
      {post.imageBase64 ? (
        <div 
          onClick={() => setSelectedPost(post)}
          className="relative aspect-square w-full bg-black overflow-hidden cursor-pointer group/img"
        >
          <img
            src={post.imageBase64}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Hover Lightbox Indicator */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Examine Whisper</span>
            </div>
          </div>

          {/* Tag Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-red-900/60 text-slate-200 text-[10px] font-mono tracking-wider shadow-md">
              {post.tag}
            </span>
          </div>
        </div>
      ) : (
        /* Text-Only Post Presentation */
        <div 
          onClick={() => setSelectedPost(post)}
          className="p-5 sm:p-6 bg-gradient-to-b from-[#131622] to-[#0e1017] border-y border-[#1c202f] cursor-pointer hover:bg-[#161a29] transition-colors relative min-h-[140px] flex flex-col justify-between group/text"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-800/70 text-red-300 text-[10px] font-mono tracking-wider">
              {post.tag}
            </span>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 group-hover/text:text-red-400 transition-colors">
              <Maximize2 className="w-3 h-3" />
              <span>Read Full</span>
            </span>
          </div>

          <p className="font-serif italic text-sm sm:text-base text-slate-200 leading-relaxed line-clamp-6 my-auto">
            “{post.caption}”
          </p>

          <div className="text-[10px] text-slate-500 font-mono text-right mt-2">
            {pht.relative}
          </div>
        </div>
      )}

      {/* Caption & Content (Shown under image if image exists) */}
      <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
        {post.imageBase64 && post.caption ? (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
            {post.caption}
          </p>
        ) : null}

        {/* Gothic Reactions Bar (Blood, Candle, Skull, Rose) */}
        <div className="pt-3 border-t border-[#1a1d2a] flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Blood reaction */}
            <button
              onClick={() => reactToPost(post.id, 'blood')}
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all ${
                userReaction === 'blood'
                  ? 'bg-red-950 text-red-300 border border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.4)]'
                  : 'bg-[#151722] hover:bg-[#1f2334] text-slate-400'
              }`}
              title="Vow of Blood"
            >
              <span>🩸</span>
              <span className="font-mono text-[11px]">{post.reactions.blood}</span>
            </button>

            {/* Candle reaction */}
            <button
              onClick={() => reactToPost(post.id, 'candle')}
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all ${
                userReaction === 'candle'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-[#151722] hover:bg-[#1f2334] text-slate-400'
              }`}
              title="Light Tallow Candle"
            >
              <span>🕯️</span>
              <span className="font-mono text-[11px]">{post.reactions.candle}</span>
            </button>

            {/* Skull reaction */}
            <button
              onClick={() => reactToPost(post.id, 'skull')}
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all ${
                userReaction === 'skull'
                  ? 'bg-slate-800 text-slate-100 border border-slate-600'
                  : 'bg-[#151722] hover:bg-[#1f2334] text-slate-400'
              }`}
              title="Relic Skull"
            >
              <span>💀</span>
              <span className="font-mono text-[11px]">{post.reactions.skull}</span>
            </button>

            {/* Rose reaction */}
            <button
              onClick={() => reactToPost(post.id, 'rose')}
              className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all ${
                userReaction === 'rose'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : 'bg-[#151722] hover:bg-[#1f2334] text-slate-400'
              }`}
              title="Nocturne Rose"
            >
              <span>🥀</span>
              <span className="font-mono text-[11px]">{post.reactions.rose}</span>
            </button>
          </div>

          {/* Comments Trigger */}
          <button
            onClick={() => setSelectedPost(post)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#151722] hover:bg-[#1f2334] text-slate-400 hover:text-slate-200 transition-colors text-xs font-mono"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.comments.length}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
