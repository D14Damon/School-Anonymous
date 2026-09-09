/**
 * Security & Anti-Hacking Protection Utilities
 * Implements input sanitization (XSS defense), base64 payload validation,
 * rate limiting for brute force defense, and secure session checking.
 */

// 1. Rate Limiting / Brute Force Lockout Guard
interface AttemptRecord {
  count: number;
  lockedUntil: number;
}

const loginAttempts: Record<string, AttemptRecord> = {};
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

export const checkRateLimit = (identifier: string): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const record = loginAttempts[identifier];

  if (!record) {
    return { allowed: true };
  }

  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds: remainingSeconds };
  }

  // If lockout expired, reset
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    delete loginAttempts[identifier];
    return { allowed: true };
  }

  return { allowed: true };
};

export const recordFailedAttempt = (identifier: string): { locked: boolean; waitSeconds?: number } => {
  const now = Date.now();
  const record = loginAttempts[identifier] || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts[identifier] = record;
    return { locked: true, waitSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  loginAttempts[identifier] = record;
  return { locked: false };
};

export const clearRateLimit = (identifier: string): void => {
  delete loginAttempts[identifier];
};

// 2. Input Sanitization (XSS / Injection Defense)
export const sanitizeText = (input: string, maxLength = 1000): string => {
  if (!input) return '';
  // Truncate to maximum length
  const truncated = input.slice(0, maxLength);
  // Strip dangerous HTML tags and script injections
  return truncated
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // remove all HTML tags
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // remove event handlers like onload, onerror, onclick
    .trim();
};

// 3. Image Base64 Payload Validation (Anti-Malware & Memory Bomb Protection)
export const validateBase64Image = (base64Str: string): { valid: boolean; error?: string } => {
  if (!base64Str || typeof base64Str !== 'string') {
    return { valid: false, error: 'Image payload is missing' };
  }

  // Must match standard data URI for images
  const regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;
  if (!regex.test(base64Str)) {
    return { valid: false, error: 'Invalid image format or corrupted payload' };
  }

  // Max payload size: ~2.5MB string (500x500 images are typically 100kb-400kb)
  if (base64Str.length > 2.5 * 1024 * 1024) {
    return { valid: false, error: 'Image size exceeds maximum security limit (2.5MB)' };
  }

  return { valid: true };
};

// 4. Password Complexity / Security Check
export const validatePasswordStrength = (password: string): { strong: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return { strong: false, message: 'Password must be at least 6 characters long' };
  }
  if (password.toLowerCase() === 'password' || password === '123456' || password === 'qwerty') {
    return { strong: false, message: 'Password is too common and easily hackable' };
  }
  return { strong: true };
};

// 5. Creator Authorization Verification
export const CREATOR_EMAIL = 'xiaolongbao312006@gmail.com';

export const isCreatorEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === CREATOR_EMAIL.toLowerCase();
};

// 6. Anonymous Nickname Validation
export const validateAnonymousNickname = (nickname: string): { valid: boolean; message?: string } => {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, message: 'Unique nickname is required for anonymous profile' };
  }
  const clean = nickname.trim();
  if (clean.length < 3) {
    return { valid: false, message: 'Nickname must be at least 3 characters' };
  }
  if (clean.length > 20) {
    return { valid: false, message: 'Nickname cannot exceed 20 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
    return { valid: false, message: 'Nickname can only contain letters, numbers, hyphens, and underscores' };
  }
  return { valid: true };
};
