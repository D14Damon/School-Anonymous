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
  validateAnonymousNickname
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
  addComment: (postId: string, text: string, isAnonymous: boolean) => Promise<{ success: boolean; error?: string }>;
  
  // Creator / School Approval actions
  approveSchool: (schoolId: string, note?: string) => Promise<void>;
  declineSchool: (schoolId: string, note?: string) => Promise<void>;
  submitNewSchool: (name: string, city?: string, country?: string) => Promise<string>;
  pendingSchoolCount: number;
  approvedSchools: School[];
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
            setCurrentUser({
              id: fbUser.uid,
              name: sanitizeText(data.name || fbUser.displayName || 'Scholar', 100),
              email: fbUser.email || '',
              avatarBase64: data.avatarBase64 || generateGothicCanvasBase64(data.name || 'Scholar', 'Enlisted', 'cathedral'),
              isAnonymous: data.isAnonymous || false,
              anonymousNickname: data.anonymousNickname || undefined,
              anonymousNicknameLower: data.anonymousNicknameLower || (data.anonymousNickname ? String(data.anonymousNickname).toLowerCase() : undefined),
              schoolId: data.schoolId || 'unassigned',
              schoolName: data.schoolName || '',
              role: isCreator ? 'creator' : (data.role || 'student'),
              bio: sanitizeText(data.bio || '', 1000),
              year: sanitizeText(data.year || '', 50),
              createdAt: data.createdAt || new Date().toISOString(),
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
            const newUser: User = {
              id: fbUser.uid,
              name: sanitizeText(fbUser.displayName || fbUser.email?.split('@')[0] || 'Scholar', 100),
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
              // fallback local
            }
            setCurrentUser(newUser);
          }
        } catch {
          // Offline/fallback
          const fallbackUser: User = {
            id: fbUser.uid,
            name: sanitizeText(fbUser.displayName || fbUser.email?.split('@')[0] || 'Scholar', 100),
            email: fbUser.email || '',
            avatarBase64: generateGothicCanvasBase64(fbUser.email?.split('@')[0] || 'Scholar', 'Verified', 'cathedral'),
            isAnonymous: false,
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
          loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<Post, 'id'>) });
        });
        // Guarantee most recent post is at the top
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPosts(loaded);
      }, (err) => {
        console.warn('Firestore posts listener note:', err.message);
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, []);

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

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        schoolId,
        schoolName: cleanSchoolName,
      });
    } catch {
      // fallback
    }
  };

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
    } catch (err) {
      console.warn('Could not update user in firestore:', err);
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

    // If turning on Compelled mode, verify they already have a unique nickname
    if (nextState && !currentUser.anonymousNickname) {
      setIsProfileModalOpen(true);
      return { 
        success: false, 
        error: 'Please configure a unique Compelled nickname first to turn Compelled on.' 
      };
    }

    return await updateProfile({ isAnonymous: nextState });
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

    const newPostData: Omit<Post, 'id'> = {
      userId: currentUser.id,
      authorName: authorDisplayName,
      authorAvatarBase64: isAnonymous ? ANONYMOUS_AVATAR_BASE64 : currentUser.avatarBase64,
      isAnonymous,
      schoolId: currentUser.schoolId || 'unassigned',
      schoolName: currentUser.schoolName || 'Independent Scholar',
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
      reactions: { blood: 1, candle: 1, skull: 0, rose: 0 },
      userReactions: { [currentUser.id]: 'candle' as keyof PostReactions },
      comments: [],
    };

    try {
      const docRef = await addDoc(collection(db, 'posts'), newPostData);
      const postWithId: Post = { id: docRef.id, ...newPostData };
      setPosts((prev) => [postWithId, ...prev]);
      return { success: true };
    } catch {
      // Local fallback
      const localPost: Post = { id: `post-${Date.now()}`, ...newPostData };
      setPosts((prev) => [localPost, ...prev]);
      return { success: true };
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
    } catch {
      // fallback local
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
    } catch {
      // fallback
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
        updateProfile,
        toggleAnonymity,
        createPost,
        reactToPost,
        addComment,
        approveSchool,
        declineSchool,
        submitNewSchool,
        pendingSchoolCount,
        approvedSchools,
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
