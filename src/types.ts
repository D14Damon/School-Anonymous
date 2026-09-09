export type UserRole = 'creator' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarBase64: string; // 500x500 base64 image
  isAnonymous: boolean; // Hide profile picture and real name
  anonymousNickname?: string; // Unique nickname required for anonymous profile
  anonymousNicknameLower?: string; // Lowercase for uniqueness checks
  schoolId: string;
  schoolName: string;
  role: UserRole;
  bio?: string;
  year?: string;
  createdAt: string;
  lastSchoolSwitchedAt?: string; // ISO timestamp of last school switch (30-day cooldown for students, 0 cooldown for creator)
}

export type SchoolStatus = 'approved' | 'pending' | 'declined';

export interface School {
  id: string;
  name: string;
  city?: string;
  country?: string;
  status: SchoolStatus;
  submittedByUserId: string;
  submittedByUserName: string;
  submittedAt: string;
  moderationNote?: string;
  studentCount: number;
  postCount: number;
}

export type PostTag = 'Confessions' | 'Shoutouts' | 'ngl / tbh / fr' | 'Rants & Vent' | 'Questions & Curious' | 'Appreciation';

export interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarBase64: string;
  isAnonymous: boolean;
  text: string;
  createdAt: string;
}

export interface PostReactions {
  blood: number;
  candle: number;
  skull: number;
  rose: number;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarBase64: string; // 500x500 base64
  isAnonymous: boolean; // Compelled mode: hides real identity and profile
  schoolId: string;
  schoolName: string;
  authorYear?: string; // Visible when Compelled is OFF
  authorBio?: string;  // Visible when Compelled is OFF
  imageBase64?: string; // Optional 500x500 base64 image (text-only posts allowed)
  caption: string;
  tag: PostTag;
  createdAt: string;
  reactions: PostReactions;
  userReactions: Record<string, keyof PostReactions>; // userId -> reactionType
  comments: Comment[];
}
