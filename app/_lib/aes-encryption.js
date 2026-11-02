import 'server-only';
import crypto from 'node:crypto';

/**
 * =====================================================================
 * UA Scholar - AES-256-GCM encryption (single file, server-only)
 *
 * Import from any Server Component, Server Action or Route Handler:
 *   import { encryptStudentData, decryptStudentData } from '@/app/_lib/aes-encryption';
 *
 * (The "_lib" folder starts with "_", so Next.js never turns it into a page.)
 *
 * D1 - Students:  personal info, academic records, application answers,
 *                 uploaded documents (file bytes + file names)
 * D2 - Admins:    admin account details, scholarship review records
 *
 * KEYS
 *   Only ONE secret is needed in .env.local:  AES_SECRET_KEY=<32+ random characters>
 *   Two independent AES-256 keys are derived from it with scrypt:
 *     - student key  (purpose "student")
 *     - admin key    (purpose "admin")
 *   So leaking ciphertext of one type never helps decrypt the other.
 *   If AES_SECRET_KEY is lost or changed, existing encrypted data CANNOT be recovered.
 *
 * WHY GCM
 *   AES-GCM encrypts AND authenticates: modified data fails to decrypt.
 *   Each value is bound to an owner id (AAD), so ciphertext copied into
 *   another user's row will not decrypt.
 * =====================================================================
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended IV size for GCM
const TAG_LENGTH = 16;
const VERSION = 'v1';
const SECRET_ENV = 'AES_SECRET_KEY';
const MIN_SECRET_LENGTH = 32;

const PURPOSE = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

// ---------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------

const keyCache = new Map();

/** Derives (once per server process) the 32-byte AES key for a purpose. */
function getKey(purpose) {
  if (keyCache.has(purpose)) return keyCache.get(purpose);

  const secret = process.env[SECRET_ENV];
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`${SECRET_ENV} must be set in .env.local and be at least ${MIN_SECRET_LENGTH} characters long.`);
  }

  // scrypt is deliberately slow, which protects against guessing a weak secret.
  const key = crypto.scryptSync(secret, `ua-scholar:${purpose}:${VERSION}`, 32);
  keyCache.set(purpose, key);
  return key;
}

// ---------------------------------------------------------------------
// Core AES-GCM helpers
// ---------------------------------------------------------------------

function createCipher(key, iv, context) {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  if (context) cipher.setAAD(Buffer.from(String(context), 'utf8'));
  return cipher;
}

function createDecipher(key, iv, tag, context) {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  if (context) decipher.setAAD(Buffer.from(String(context), 'utf8'));
  decipher.setAuthTag(tag);
  return decipher;
}

/** Encrypts a string. Output: "v1:<iv>:<tag>:<ciphertext>" (base64 parts). */
function encryptText(plainText, key, context) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = createCipher(key, iv, context);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypts a value produced by encryptText. Throws if it was modified. */
function decryptText(payload, key, context) {
  const [version, ivB64, tagB64, dataB64] = String(payload).split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error('Invalid encrypted payload');
  }
  const decipher = createDecipher(key, Buffer.from(ivB64, 'base64'), Buffer.from(tagB64, 'base64'), context);
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

/** Encrypts binary data (files). Output layout: [iv | tag | ciphertext]. */
function encryptBuffer(buffer, key, context) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = createCipher(key, iv, context);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
}

/** Decrypts binary data produced by encryptBuffer. */
function decryptBuffer(buffer, key, context) {
  if (buffer.length < IV_LENGTH + TAG_LENGTH) throw new Error('Invalid encrypted file');
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipher(key, iv, tag, context);
  return Buffer.concat([decipher.update(buffer.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]);
}

function encryptJson(value, purpose, context) {
  if (value === null || value === undefined) return null;
  return encryptText(JSON.stringify(value), getKey(purpose), context);
}

function decryptJson(payload, purpose, context, fallback) {
  if (!payload) return fallback;
  try {
    return JSON.parse(decryptText(payload, getKey(purpose), context));
  } catch (error) {
    console.error(`Failed to decrypt ${purpose} data:`, error.message);
    return fallback;
  }
}

// ---------------------------------------------------------------------
// D1 - AES encryption for STUDENTS
// (personal information, academic records, application documents)
// `studentId` is bound to the ciphertext.
// ---------------------------------------------------------------------

/** Encrypts any JSON value (object, string, number). Returns null for empty input. */
export function encryptStudentData(value, studentId) {
  return encryptJson(value, PURPOSE.STUDENT, studentId);
}

/** Decrypts student data. Returns `fallback` if empty or unreadable. */
export function decryptStudentData(payload, studentId, fallback = null) {
  return decryptJson(payload, PURPOSE.STUDENT, studentId, fallback);
}

/** Encrypts an uploaded document (Buffer) before it goes to file storage. */
export function encryptStudentFile(buffer, studentId) {
  return encryptBuffer(buffer, getKey(PURPOSE.STUDENT), studentId);
}

/** Decrypts a stored document back to its original bytes. */
export function decryptStudentFile(buffer, studentId) {
  return decryptBuffer(buffer, getKey(PURPOSE.STUDENT), studentId);
}

// ---------------------------------------------------------------------
// D2 - AES encryption for SCHOLARSHIP ADMINISTRATORS
// (admin account details, scholarship records such as review notes)
// `recordId` (admin id or application id) is bound to the ciphertext.
// ---------------------------------------------------------------------

export function encryptAdminData(value, recordId) {
  return encryptJson(value, PURPOSE.ADMIN, recordId);
}

export function decryptAdminData(payload, recordId, fallback = null) {
  return decryptJson(payload, PURPOSE.ADMIN, recordId, fallback);
}
