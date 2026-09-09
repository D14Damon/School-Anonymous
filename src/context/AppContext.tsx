import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, School, Post, PostTag, PostReactions, Comment } from '../types';
import { ANONYMOUS_AVATAR_BASE64, generateGothicCanvasBase64 } from '../utils/imageUtils';
import { 
  sanitizeText, 
  validateBase64Image, 
  checkRateLimit, 
  recordFailedAttempt, 
  clearRateLimit, 
  isCreatorEmail, 
  validatePasswordStrength,
  validateAnonymousNickname,
  checkSchoolSwitchCooldown,
  SchoolSwitchCooldownStatus
} from '../utils/security';
import { 
  auth, 
  googleProvider, 
  db,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc,
  increment,
  onSnapshot, 
  query, 
  orderBy,
  where
} from '../firebase';

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
  schools: School[];
  posts: Post[];
  activeSchoolFilter: string;
  setActiveSchoolFilter: (id: string) => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  activeView: 'feed' | 'schools' | 'creator-chamber' | 'profile';
  setActiveView: (view: 'feed' | 'schools' | 'creator-chamber' | 'profile') => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isCreatePostModalOpen: boolean;
  setIsCreatePostModalOpen: (open: boolean) => void;
  
  // Auth actions
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (params: {
    name: string;
    email: string;
    pass: string;
    avatarBase64?: string;
    isAnonymous?: boolean;
    anonymousNickname?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Nickname validation and uniqueness
  checkNicknameAvailability: (nickname: string, excludeUserId?: string) => Promise<{ available: boolean; error?: string }>;

  // School selection & onboarding
  selectUserSchool: (schoolId: string, schoolName: string) => Promise<void>;
  switchSchool: (schoolId: string, schoolName: string) => Promise<{ success: boolean; error?: string }>;
  schoolSwitchCooldown: SchoolSwitchCooldownStatus;
  
  // Profile actions
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  toggleAnonymity: () => Promise<{ success: boolean; error?: string }>;
  
  // Post actions
  createPost: (params: {
    imageBase64?: string;
    caption: string;
    tag: PostTag;
    isAnonymous: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  reactToPost: (postId: string, reactionType: keyof PostReactions) => Promise<void>;
  boostPostReaction: (postId: string, reactionType: keyof PostReactions, amount?: number) => Promise<{ success: boolean; error?: string }>;
  addComment: (postId: string, text: string, isAnonymous: boolean) => Promise<{ success: boolean; error?: string }>;
  deletePost: (postId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Creator / School Approval actions
  approveSchool: (schoolId: string, note?: string) => Promise<void>;
  declineSchool: (schoolId: string, note?: string) => Promise<void>;
  deleteSchool: (schoolId: string) => Promise<{ success: boolean; error?: string }>;
  submitNewSchool: (name: string, city?: string, country?: string) => Promise<string>;
  pendingSchoolCount: number;
  approvedSchools: School[];
  getSchoolMemberCount: (schoolId?: string) => number;
  schoolMemberCounts: Record<string, number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Purge any legacy mock data once
const PURGE_FLAG_KEY = 'sa_clean_prod_v4';
try {
  if (localStorage.getItem(PURGE_FLAG_KEY) !== 'cleared') {
    localStorage.removeItem('school_anonymous_user');
    localStorage.removeItem('school_anonymous_schools');
    localStorage.removeItem('school_anonymous_posts');
    localStorage.setItem(PURGE_FLAG_KEY, 'cleared');
  }
} catch {
  // ignore
}

const normalizeReactionType = (reactionType: string): keyof PostReactions => {
  const legacyMap: Record<string, keyof PostReactions> = {
    blood: 'angry',
    candle: 'like',
    skull: 'sad',
    rose: 'love',
  };
  return legacyMap[reactionType] || (reactionType as keyof PostReactions);
};

const normalizeReactions = (reactions: Partial<Record<string, number>> = {}): PostReactions => ({
  like: Number(reactions.like || 0) + Number(reactions.candle || 0),
  love: Number(reactions.love || 0) + Number(reactions.rose || 0),
  haha: Number(reactions.haha || 0),
  sad: Number(reactions.sad || 0) + Number(reactions.skull || 0),
  angry: Number(reactions.angry || 0) + Number(reactions.blood || 0),
});

const normalizePost = (id: string, data: Omit<Post, 'id'>): Post => ({
  ...data,
  id,
  reactions: normalizeReactions(data.reactions as unknown as Partial<Record<string, number>>),
  userReactions: Object.fromEntries(
    Object.entries(data.userReactions || {}).map(([userId, reaction]) => [userId, normalizeReactionType(reaction)])
  ),
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [activeSchoolFilter, setActiveSchoolFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'feed' | 'schools' | 'creator-chamber' | 'profile'>('feed');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState<boolean>(false);

  // 1. Firebase Auth listener with automatic Creator role recognition
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isCreator = isCreatorEmail(fbUser.email);
        const role = isCreator ? 'creator' : 'student';

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const shouldBeCreator = isCreator;
            const updatedRole = shouldBeCreator ? 'creator' : (data.role || 'student');

            // Sync role to Firestore doc: promote genuine creator, demote any non-creator
            if (shouldBeCreator && data.role !== 'creator') {
              try {
                await updateDoc(userDocRef, { role: 'creator' });
              } catch {
                // ignore
              }
            } else if (!shouldBeCreator && data.role === 'creator') {
              try {
                await updateDoc(userDocRef, { role: 'student' });
              } catch {
                // ignore
              }
            }

            // Restore Compelled status: check local storage first, then firestore doc
            let restoredIsAnonymous = Boolean(data.isAnonymous);
            try {
              const localCompelled = localStorage.getItem('school_anonymous_compelled_' + fbUser.uid);
              if (localCompelled !== null) {
                restoredIsAnonymous = localCompelled === 'true';
              }
            } catch {
              // ignore
            }

            setCurrentUser({
              id: fbUser.uid,
              name: sanitizeText(data.name || fbUser.displayName || 'Scholar', 100),
              email: fbUser.email || '',
              avatarBase64: data.avatarBase64 || generateGothicCanvasBase64(data.name || 'Scholar', 'Enlisted', 'cathedral'),
              isAnonymous: restoredIsAnonymous,
              anonymousNickname: data.anonymousNickname || undefined,
              anonymousNicknameLower: data.anonymousNicknameLower || (data.anonymousNickname ? String(data.anonymousNickname).toLowerCase() : undefined),
              schoolId: shouldBeCreator && (!data.schoolId || data.schoolId === 'unassigned') ? 'creator-hq' : (data.schoolId || 'unassigned'),
              schoolName: shouldBeCreator && (!data.schoolName) ? 'Website Creator Council' : (data.schoolName || ''),
              role: updatedRole,
              bio: sanitizeText(data.bio || '', 1000),
              year: sanitizeText(data.year || '', 50),
              createdAt: data.createdAt || new Date().toISOString(),
              lastSchoolSwitchedAt: data.lastSchoolSwitchedAt || undefined,
            });
            if (data.schoolId && data.schoolId !== 'unassigned') {
              setActiveSchoolFilter(data.schoolId);
            }
          } else {
            // First time user: initialize profile
            const defaultAvatar = generateGothicCanvasBase64(
              fbUser.displayName || fbUser.email?.split('@')[0] || 'Scholar',
              'School Anonymous',
              'cathedral'
            );
            let initialAnon = false;
            try {
              const localCompelled = localStorage.getItem('school_anonymous_compelled_' + fbUser.uid);
              if (localCompelled !== null) initialAnon = localCompelled === 'true';
            } catch {}

            const newUser: User = {
              id: fbUser.uid,
              name: sanitizeText(fbUser.displayName || fbUser.email?.split('@')[0] || 'Scholar', 100),
              email: fbUser.email || '',
              avatarBase64: defaultAvatar,
              isAnonymous: initialAnon,
              schoolId: isCreator ? 'creator-hq' : 'unassigned',
              schoolName: isCreator ? 'Website Creator Council' : '',
              role,
              bio: '',
              year: '',
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newUser);
            } catch {
              // fallback local
            }
            setCurrentUser(newUser);
          }
        } catch {
          // Offline/fallback
          let fallbackAnon = false;
          try {
            const localCompelled = localStorage.getItem('school_anonymous_compelled_' + fbUser.uid);
            if (localCompelled !== null) fallbackAnon = localCompelled === 'true';
          } catch {}

          const fallbackUser: User = {
            id: fbUser.uid,
            name: sanitizeText(fbUser.displayName || fbUser.email?.split('@')[0] || 'Scholar', 100),
            email: fbUser.email || '',
            avatarBase64: generateGothicCanvasBase64(fbUser.email?.split('@')[0] || 'Scholar', 'Verified', 'cathedral'),
            isAnonymous: fallbackAnon,
            schoolId: isCreator ? 'creator-hq' : 'unassigned',
            schoolName: isCreator ? 'Website Creator Council' : '',
            role,
            createdAt: new Date().toISOString(),
          };
          setCurrentUser(fallbackUser);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Schools listener
  useEffect(() => {
    try {
      const schoolsCol = collection(db, 'schools');
      const unsubscribe = onSnapshot(schoolsCol, (snapshot) => {
        const loaded: School[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<School, 'id'>) });
        });
        setSchools(loaded);
      }, (err) => {
        console.warn('Firestore schools listener note:', err.message);
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  // 3. Real-time Posts listener
  useEffect(() => {
    try {
      const postsCol = collection(db, 'posts');
      const q = query(postsCol, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded: Post[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(normalizePost(docSnap.id, docSnap.data() as Omit<Post, 'id'>));
        });
        // Guarantee most recent post is at the top
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(loaded);
        setSelectedPost((selected) => selected ? loaded.find((post) => post.id === selected.id) || null : null);
      }, (err) => {
        console.warn('Firestore posts listener note:', err.message);
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  const [schoolMemberCounts, setSchoolMemberCounts] = useState<Record<string, number>>({});
  const [hasLoadedSchoolMemberCounts, setHasLoadedSchoolMemberCounts] = useState(false);

  // 4. Real-time School Member Counts listener from users collection
  useEffect(() => {
    try {
      const usersCol = collection(db, 'users');
      const unsubscribe = onSnapshot(usersCol, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach((docSnap) => {
          const uData = docSnap.data();
          const sId = uData.schoolId;
          if (sId && sId !== 'unassigned' && sId !== 'creator-hq') {
            counts[sId] = (counts[sId] || 0) + 1;
          }
        });
        setSchoolMemberCounts(counts);
        setHasLoadedSchoolMemberCounts(true);
      }, (err) => {
        console.warn('Firestore users member listener note:', err.message);
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

  const getSchoolMemberCount = (schoolId?: string): number => {
    if (!schoolId || schoolId === 'unassigned') return 0;
    const realtime = schoolMemberCounts[schoolId] || 0;
    const sch = schools.find((s) => s.id === schoolId);
    const staticCount = sch?.studentCount || 0;
    return hasLoadedSchoolMemberCounts ? realtime : Math.max(staticCount, 0);
  };

  const pendingSchoolCount = schools.filter((s) => s.status === 'pending').length;
  const approvedSchools = schools.filter((s) => s.status === 'approved');

  // AUTH ACTIONS WITH BRUTE-FORCE RATE LIMITING & SECURITY WALL
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = sanitizeText(email, 150).toLowerCase().trim();

    // 1. Check Rate Limit (Anti-Brute Force Protection)
    const rateCheck = checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return { 
        success: false, 
        error: `Security Lockout: Too many failed attempts. Try again in ${rateCheck.waitSeconds} seconds.` 
      };
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      clearRateLimit(cleanEmail);
      return { success: true };
    } catch (err: any) {
      const fail = recordFailedAttempt(cleanEmail);
      if (fail.locked) {
        return { 
          success: false, 
          error: `Account locked for ${fail.waitSeconds}s due to repeated invalid attempts.` 
        };
      }
      return { success: false, error: err.message || 'Login failed. Verify credentials.' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setActiveSchoolFilter('all');
  };

  // CHECK UNIQUE ANONYMOUS NICKNAME
  const checkNicknameAvailability = async (
    nickname: string,
    excludeUserId?: string
  ): Promise<{ available: boolean; error?: string }> => {
    const val = validateAnonymousNickname(nickname);
    if (!val.valid) {
      return { available: false, error: val.message };
    }

    const clean = nickname.trim();
    const cleanLower = clean.toLowerCase();

    try {
      const q = query(
        collection(db, 'users'),
        where('anonymousNicknameLower', '==', cleanLower)
      );
      const snap = await getDocs(q);

      const conflict = snap.docs.some((docSnap) => docSnap.id !== excludeUserId);
      if (conflict) {
        return {
          available: false,
          error: `Nickname "@${clean}" is already taken by another scholar. Please choose a unique one.`,
        };
      }
      return { available: true };
    } catch (err: any) {
      console.warn('Could not query firestore for nickname availability:', err);
      // Fallback
      return { available: true };
    }
  };

  const registerWithEmail = async ({
    name,
    email,
    pass,
    avatarBase64,
    isAnonymous = false,
    anonymousNickname = '',
  }: {
    name: string;
    email: string;
    pass: string;
    avatarBase64?: string;
    isAnonymous?: boolean;
    anonymousNickname?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanName = sanitizeText(name, 100);
    const cleanEmail = sanitizeText(email, 150).toLowerCase().trim();

    if (!cleanName) {
      return { success: false, error: 'Name is required' };
    }

    // If user desires anonymous profile, a unique nickname MUST be provided and checked
    let cleanNick = '';
    if (isAnonymous) {
      if (!anonymousNickname || !anonymousNickname.trim()) {
        return { success: false, error: 'Please provide a unique anonymous nickname.' };
      }
      const check = await checkNicknameAvailability(anonymousNickname.trim());
      if (!check.available) {
        return { success: false, error: check.error || 'Nickname is already taken.' };
      }
      cleanNick = anonymousNickname.trim();
    }

    // Validate password strength against hack dictionary
    const pwCheck = validatePasswordStrength(pass);
    if (!pwCheck.strong) {
      return { success: false, error: pwCheck.message };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const isCreator = isCreatorEmail(cleanEmail);
      const role = isCreator ? 'creator' : 'student';

      const defaultAvatar = avatarBase64 || generateGothicCanvasBase64(cleanName, 'School Anonymous', 'candle');

      const userProfile: User = {
        id: cred.user.uid,
        name: cleanName,
        email: cleanEmail,
        avatarBase64: defaultAvatar,
        isAnonymous,
        anonymousNickname: cleanNick || undefined,
        anonymousNicknameLower: cleanNick ? cleanNick.toLowerCase() : undefined,
        schoolId: isCreator ? 'creator-hq' : 'unassigned',
        schoolName: isCreator ? 'Website Creator Council' : '',
        role,
        bio: '',
        year: '',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), userProfile);
      } catch (err) {
        console.warn('Could not save user profile to firestore:', err);
      }

      setCurrentUser(userProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const isCreator = isCreatorEmail(fbUser.email);
      const role = isCreator ? 'creator' : 'student';

      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        const defaultAvatar = generateGothicCanvasBase64(
          fbUser.displayName || 'Google Scholar',
          'Verified Account',
          'raven'
        );
        const newUser: User = {
          id: fbUser.uid,
          name: sanitizeText(fbUser.displayName || 'Google Scholar', 100),
          email: fbUser.email || '',
          avatarBase64: defaultAvatar,
          isAnonymous: false,
          schoolId: isCreator ? 'creator-hq' : 'unassigned',
          schoolName: isCreator ? 'Website Creator Council' : '',
          role,
          bio: '',
          year: '',
          createdAt: new Date().toISOString(),
        };
        try {
          await setDoc(userDocRef, newUser);
        } catch {
          // fallback
        }
        setCurrentUser(newUser);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign in failed.' };
    }
  };

  // SCHOOL ONBOARDING SELECTION
  const selectUserSchool = async (schoolId: string, schoolName: string) => {
    if (!currentUser) return;
    const cleanSchoolName = sanitizeText(schoolName, 200);

    const updatedUser: User = {
      ...currentUser,
      schoolId,
      schoolName: cleanSchoolName,
    };
    setCurrentUser(updatedUser);
    setActiveSchoolFilter(schoolId);
    setActiveView('feed');

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        schoolId,
        schoolName: cleanSchoolName,
      });
      if (schoolId && schoolId !== 'creator-hq' && schoolId !== 'unassigned') {
        try {
          await updateDoc(doc(db, 'schools', schoolId), {
            studentCount: increment(1),
          });
        } catch {
          // ignore
        }
      }
    } catch {
      // fallback
    }
  };

  // SCHOOL SWITCHING WITH 30-DAY COOLDOWN (CREATOR EXEMPTION: NO COOLDOWN)
  const switchSchool = async (
    schoolId: string,
    schoolName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'You must be signed in to switch schools.' };
    }

    if (currentUser.schoolId === schoolId) {
      return { success: false, error: 'You are already enrolled in this school.' };
    }

    // Check 30-day cooldown policy (creator has 0 cooldown)
    const cooldown = checkSchoolSwitchCooldown(currentUser);
    if (!cooldown.canSwitch) {
      return {
        success: false,
        error: cooldown.reason || `School transfer is on a 30-day cooldown (${cooldown.formattedRemaining}).`,
      };
    }

    const cleanSchoolName = sanitizeText(schoolName, 200);
    const nowIso = new Date().toISOString();
    const isCreator = currentUser.role === 'creator' || isCreatorEmail(currentUser.email);

    const previousSchoolId = currentUser.schoolId;

    const updatedUser: User = {
      ...currentUser,
      schoolId,
      schoolName: cleanSchoolName,
      lastSchoolSwitchedAt: isCreator ? undefined : nowIso,
    };

    setCurrentUser(updatedUser);
    setActiveSchoolFilter(schoolId);

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        schoolId,
        schoolName: cleanSchoolName,
        ...(isCreator ? {} : { lastSchoolSwitchedAt: nowIso }),
      });
    } catch (err) {
      console.warn('Could not update user school switch in firestore:', err);
    }

    // Update school member counts dynamically
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === schoolId) {
          return { ...s, studentCount: (s.studentCount || 0) + 1 };
        }
        if (previousSchoolId && s.id === previousSchoolId) {
          return { ...s, studentCount: Math.max(0, (s.studentCount || 1) - 1) };
        }
        return s;
      })
    );

    return { success: true };
  };

  const schoolSwitchCooldown = checkSchoolSwitchCooldown(currentUser);

  // PROFILE ACTIONS
  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not logged in' };

    const sanitizedUpdates: Partial<User> = {};
    if (updates.name !== undefined) sanitizedUpdates.name = sanitizeText(updates.name, 100);
    if (updates.bio !== undefined) sanitizedUpdates.bio = sanitizeText(updates.bio, 1000);
    if (updates.year !== undefined) sanitizedUpdates.year = sanitizeText(updates.year, 50);

    // Determine target anonymity status & nickname
    const targetAnonymous = updates.isAnonymous !== undefined ? Boolean(updates.isAnonymous) : currentUser.isAnonymous;
    const targetNickname = updates.anonymousNickname !== undefined 
      ? updates.anonymousNickname.trim() 
      : (currentUser.anonymousNickname || '');

    // Strict rule: Any user who wants an anonymous profile MUST provide a unique nickname
    if (targetAnonymous) {
      if (!targetNickname) {
        return { 
          success: false, 
          error: 'A unique anonymous nickname is required to enable anonymous profile.' 
        };
      }
      // If nickname is changing or being set, check uniqueness
      if (targetNickname.toLowerCase() !== (currentUser.anonymousNickname || '').toLowerCase()) {
        const check = await checkNicknameAvailability(targetNickname, currentUser.id);
        if (!check.available) {
          return { success: false, error: check.error || 'Nickname is already taken.' };
        }
      }
    }

    if (updates.isAnonymous !== undefined) {
      sanitizedUpdates.isAnonymous = Boolean(updates.isAnonymous);
      try {
        localStorage.setItem('school_anonymous_compelled_' + currentUser.id, sanitizedUpdates.isAnonymous ? 'true' : 'false');
      } catch {
        // ignore
      }
    }

    if (updates.anonymousNickname !== undefined) {
      const cleanNick = updates.anonymousNickname.trim();
      sanitizedUpdates.anonymousNickname = cleanNick || undefined;
      sanitizedUpdates.anonymousNicknameLower = cleanNick ? cleanNick.toLowerCase() : undefined;
    }

    if (updates.avatarBase64 !== undefined) {
      const imgVal = validateBase64Image(updates.avatarBase64);
      if (imgVal.valid) {
        sanitizedUpdates.avatarBase64 = updates.avatarBase64;
      }
    }

    const updated = { ...currentUser, ...sanitizedUpdates };
    setCurrentUser(updated);

    try {
      await updateDoc(doc(db, 'users', currentUser.id), sanitizedUpdates);
    } catch (err: any) {
      console.warn('Could not update user in firestore:', err);
      setCurrentUser(currentUser);
      return { success: false, error: err.message || 'Could not save profile changes. Please try again.' };
    }

    // Sync author details in posts state
    if (sanitizedUpdates.name || sanitizedUpdates.avatarBase64 || sanitizedUpdates.anonymousNickname) {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.userId === updated.id) {
            let authorName = post.authorName;
            if (post.isAnonymous) {
              authorName = updated.anonymousNickname ? `@${updated.anonymousNickname}` : 'Anonymous Scholar';
            } else if (sanitizedUpdates.name) {
              authorName = sanitizedUpdates.name;
            }
            return {
              ...post,
              authorName,
              authorAvatarBase64: sanitizedUpdates.avatarBase64 || post.authorAvatarBase64,
            };
          }
          return post;
        })
      );
    }

    return { success: true };
  };

  const toggleAnonymity = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    const nextState = !currentUser.isAnonymous;

    // Immediately persist to local storage so it stays intact across reloads or leaves
    try {
      localStorage.setItem('school_anonymous_compelled_' + currentUser.id, nextState ? 'true' : 'false');
    } catch {
      // ignore
    }

    // Auto-generate or reuse unique nickname if turning on Compelled
    let cleanNick = currentUser.anonymousNickname?.trim();
    if (nextState && !cleanNick) {
      const sanitizedName = currentUser.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      cleanNick = `Scholar_${sanitizedName || currentUser.id.slice(0, 6)}`;
    }

    return await updateProfile({ 
      isAnonymous: nextState,
      ...(cleanNick ? { anonymousNickname: cleanNick } : {})
    });
  };

  // POST ACTIONS WITH PAYLOAD VALIDATION & XSS SANITIZATION
  const createPost = async ({
    imageBase64,
    caption,
    tag,
    isAnonymous,
  }: {
    imageBase64?: string;
    caption: string;
    tag: PostTag;
    isAnonymous: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    // If posting in Compelled mode, must have a unique nickname
    if (isAnonymous && !currentUser.anonymousNickname) {
      setIsProfileModalOpen(true);
      return { 
        success: false, 
        error: 'Please choose a unique Compelled nickname before publishing in Compelled mode.' 
      };
    }

    // 1. Validate Image Payload (if provided)
    if (imageBase64) {
      const imgCheck = validateBase64Image(imageBase64);
      if (!imgCheck.valid) {
        return { success: false, error: imgCheck.error };
      }
    }

    // 2. Sanitize Caption
    const cleanCaption = sanitizeText(caption, 1500);
    if (!cleanCaption && !imageBase64) {
      return { success: false, error: 'Please enter text or upload a photo.' };
    }

    const authorDisplayName = isAnonymous 
      ? `@${currentUser.anonymousNickname || 'Compelled'}`
      : currentUser.name;

    // Scope post to active school or user's assigned school
    let targetSchoolId = currentUser.schoolId || 'unassigned';
    let targetSchoolName = currentUser.schoolName || 'Independent Scholar';

    if (isCreatorEmail(currentUser.email) && activeSchoolFilter && activeSchoolFilter !== 'all') {
      const activeSch = approvedSchools.find((s) => s.id === activeSchoolFilter);
      if (activeSch) {
        targetSchoolId = activeSch.id;
        targetSchoolName = activeSch.name;
      }
    } else if (currentUser.schoolId && currentUser.schoolId !== 'unassigned') {
      targetSchoolId = currentUser.schoolId;
      targetSchoolName = currentUser.schoolName;
    } else if (approvedSchools.length > 0) {
      targetSchoolId = approvedSchools[0].id;
      targetSchoolName = approvedSchools[0].name;
    }

    const newPostData: Omit<Post, 'id'> = {
      userId: currentUser.id,
      authorName: authorDisplayName,
      authorAvatarBase64: isAnonymous ? ANONYMOUS_AVATAR_BASE64 : currentUser.avatarBase64,
      isAnonymous,
      schoolId: targetSchoolId,
      schoolName: targetSchoolName,
      ...(isAnonymous
        ? {}
        : {
            authorYear: currentUser.year || undefined,
            authorBio: currentUser.bio || undefined,
          }),
      ...(imageBase64 ? { imageBase64 } : {}),
      caption: cleanCaption || '',
      tag,
      createdAt: new Date().toISOString(),
      reactions: { like: 0, love: 0, haha: 0, sad: 0, angry: 0 },
      userReactions: {},
      comments: [],
    };

    try {
      const docRef = await addDoc(collection(db, 'posts'), newPostData);
      const postWithId: Post = { id: docRef.id, ...newPostData };
      setPosts((prev) => [postWithId, ...prev]);

      // Increment school post count
      if (targetSchoolId && targetSchoolId !== 'unassigned') {
        try {
          await updateDoc(doc(db, 'schools', targetSchoolId), {
            postCount: increment(1),
          });
        } catch {
          // ignore
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create post in Firestore:', err);
      return { success: false, error: err.message || 'Could not publish post. Please try again.' };
    }
  };

  // POST DELETION (Website Creator can delete any post; Authors can delete their own)
  const deletePost = async (postId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'You must be signed in to delete a post.' };
    }

    const postToDelete = posts.find((p) => p.id === postId);
    if (!postToDelete) {
      return { success: false, error: 'Post not found.' };
    }

    const isCreator = currentUser.role === 'creator' || isCreatorEmail(currentUser.email);
    const isAuthor = currentUser.id === postToDelete.userId;

    if (!isCreator && !isAuthor) {
      return { success: false, error: 'Unauthorized: Only the author or Website Creator can delete this post.' };
    }

    try {
      await deleteDoc(doc(db, 'posts', postId));

      // Optimistically update posts state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }

      // Decrement school postCount
      if (postToDelete.schoolId && postToDelete.schoolId !== 'unassigned') {
        try {
          await updateDoc(doc(db, 'schools', postToDelete.schoolId), {
            postCount: increment(-1),
          });
        } catch {
          // ignore
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting post from Firestore:', err);
      return { success: false, error: err.message || 'Could not delete post. Please try again.' };
    }
  };

  const reactToPost = async (postId: string, reactionType: keyof PostReactions) => {
    if (!currentUser) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const currentReaction = post.userReactions?.[currentUser.id];
    const newReactions = { ...post.reactions };
    const newUserReactions = { ...(post.userReactions || {}) };

    if (currentReaction === reactionType) {
      newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
      delete newUserReactions[currentUser.id];
    } else {
      if (currentReaction) {
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
      }
      newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
      newUserReactions[currentUser.id] = reactionType;
    }

    const updatedPost = {
      ...post,
      reactions: newReactions,
      userReactions: newUserReactions,
    };

    setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(updatedPost);
    }

    try {
      await updateDoc(doc(db, 'posts', postId), {
        reactions: newReactions,
        userReactions: newUserReactions,
      });
    } catch (err: any) {
      setPosts((prev) => prev.map((candidate) => (candidate.id === postId ? post : candidate)));
      if (selectedPost?.id === postId) setSelectedPost(post);
      console.warn('Could not save reaction:', err);
    }
  };

  const boostPostReaction = async (
    postId: string,
    reactionType: keyof PostReactions,
    amount = 1
  ): Promise<{ success: boolean; error?: string }> => {
    const isCreator = currentUser?.role === 'creator' || isCreatorEmail(currentUser?.email);
    if (!isCreator) return { success: false, error: 'Only the Website Creator can boost reactions.' };

    const post = posts.find((candidate) => candidate.id === postId);
    if (!post) return { success: false, error: 'Post not found.' };

    if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
      return { success: false, error: 'Boost amount must be between 1 and 5000.' };
    }

    const safeAmount = Math.floor(amount);

    const newReactions = {
      ...normalizeReactions(post.reactions as unknown as Partial<Record<string, number>>),
      [reactionType]: (post.reactions[reactionType] || 0) + safeAmount,
    };
    const updatedPost = { ...post, reactions: newReactions };
    setPosts((prev) => prev.map((candidate) => (candidate.id === postId ? updatedPost : candidate)));
    if (selectedPost?.id === postId) setSelectedPost(updatedPost);

    try {
      await updateDoc(doc(db, 'posts', postId), { reactions: newReactions });
      return { success: true };
    } catch (err: any) {
      setPosts((prev) => prev.map((candidate) => (candidate.id === postId ? post : candidate)));
      if (selectedPost?.id === postId) setSelectedPost(post);
      return { success: false, error: err.message || 'Could not boost reaction.' };
    }
  };

  const addComment = async (postId: string, text: string, isAnonymous = false): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };

    const cleanText = sanitizeText(text, 500);
    if (!cleanText) return { success: false, error: 'Comment cannot be empty' };

    if (isAnonymous && !currentUser.anonymousNickname) {
      setIsProfileModalOpen(true);
      return { success: false, error: 'Please set a unique Compelled nickname to reply in Compelled mode.' };
    }

    const authorDisplayName = isAnonymous
      ? `@${currentUser.anonymousNickname || 'Compelled'}`
      : currentUser.name;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      authorName: authorDisplayName,
      authorAvatarBase64: isAnonymous ? ANONYMOUS_AVATAR_BASE64 : currentUser.avatarBase64,
      isAnonymous,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    const post = posts.find((p) => p.id === postId);
    if (!post) return { success: false, error: 'Post not found' };

    const updatedComments = [...(post.comments || []), newComment];
    const updatedPost = { ...post, comments: updatedComments };

    setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(updatedPost);
    }

    try {
      await updateDoc(doc(db, 'posts', postId), {
        comments: updatedComments,
      });
    } catch (err: any) {
      setPosts((prev) => prev.map((candidate) => (candidate.id === postId ? post : candidate)));
      if (selectedPost?.id === postId) setSelectedPost(post);
      console.warn('Could not save comment:', err);
      return { success: false, error: err.message || 'Could not save comment. Please try again.' };
    }

    return { success: true };
  };

  // SCHOOL REGISTRATION & CREATOR APPROVAL ACTIONS
  const submitNewSchool = async (name: string, city = '', country = ''): Promise<string> => {
    const cleanName = sanitizeText(name, 200);
    const cleanCity = sanitizeText(city, 100);
    const cleanCountry = sanitizeText(country, 100);

    const newSchoolData = {
      name: cleanName,
      city: cleanCity,
      country: cleanCountry,
      status: 'pending' as const,
      submittedByUserId: currentUser?.id || 'applicant',
      submittedByUserName: currentUser?.name || 'Applicant',
      submittedAt: new Date().toISOString(),
      studentCount: 1,
      postCount: 0,
      moderationNote: 'Awaiting Website Creator review',
    };

    try {
      const docRef = await addDoc(collection(db, 'schools'), newSchoolData);
      const created: School = { id: docRef.id, ...newSchoolData };
      setSchools((prev) => [created, ...prev]);
      return docRef.id;
    } catch {
      const localId = `sch-${Date.now()}`;
      const localSchool: School = { id: localId, ...newSchoolData };
      setSchools((prev) => [localSchool, ...prev]);
      return localId;
    }
  };

  const approveSchool = async (schoolId: string, note = 'Approved by Website Creator') => {
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, status: 'approved', moderationNote: note } : s))
    );
    try {
      await updateDoc(doc(db, 'schools', schoolId), {
        status: 'approved',
        moderationNote: note,
      });
    } catch {
      // fallback
    }
  };

  const declineSchool = async (schoolId: string, note = 'Declined by Website Creator') => {
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, status: 'declined', moderationNote: note } : s))
    );
    try {
      await updateDoc(doc(db, 'schools', schoolId), {
        status: 'declined',
        moderationNote: note,
      });
    } catch {
      // fallback
    }
  };

  const deleteSchool = async (schoolId: string): Promise<{ success: boolean; error?: string }> => {
    const isCreator = currentUser?.role === 'creator' || isCreatorEmail(currentUser?.email);
    if (!isCreator) {
      return { success: false, error: 'Unauthorized: Only the Website Creator can delete a school.' };
    }

    try {
      await deleteDoc(doc(db, 'schools', schoolId));
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting school from Firestore:', err);
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      return { success: true };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        schools,
        posts,
        activeSchoolFilter,
        setActiveSchoolFilter,
        selectedPost,
        setSelectedPost,
        activeView,
        setActiveView,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isCreatePostModalOpen,
        setIsCreatePostModalOpen,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        checkNicknameAvailability,
        selectUserSchool,
        switchSchool,
        schoolSwitchCooldown,
        updateProfile,
        toggleAnonymity,
        createPost,
        reactToPost,
        boostPostReaction,
        addComment,
        deletePost,
        approveSchool,
        declineSchool,
        deleteSchool,
        submitNewSchool,
        pendingSchoolCount,
        approvedSchools,
        getSchoolMemberCount,
        schoolMemberCounts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
