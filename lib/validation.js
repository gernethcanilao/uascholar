import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from './constants';

/** Error whose message is safe to show to the user. */
export class ValidationError extends Error {}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value);
}

/** Reads a trimmed text field from FormData and validates its length. */
export function readText(formData, field, { label = field, required = false, max = 255 } = {}) {
  const raw = formData.get(field);
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (required && !value) throw new ValidationError(`${label} is required.`);
  if (value.length > max) throw new ValidationError(`${label} must be ${max} characters or less.`);
  return value;
}

/** Reads a number field and checks the allowed range. Returns null when optional and empty. */
export function readNumber(formData, field, { label = field, required = false, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const text = readText(formData, field, { label, required, max: 20 });
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${label} must be a number between ${min} and ${max}.`);
  }
  return value;
}

/**
 * Reads a textarea where each line is one list item (benefits, requirements, ...).
 * No length or count limit unless maxItems / maxLength are given.
 */
export function readLines(formData, field, { label = field, maxItems = Infinity, maxLength = Infinity } = {}) {
  const lines = readText(formData, field, { label, max: Infinity })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > maxItems) throw new ValidationError(`${label} can have at most ${maxItems} items.`);
  if (lines.some((line) => line.length > maxLength)) {
    throw new ValidationError(`Each ${label} item must be ${maxLength} characters or less.`);
  }
  return lines;
}

/** Only allows one of the given values (selects such as status or role). */
export function readChoice(formData, field, choices, { label = field } = {}) {
  // Long enough for the longest allowed choice (e.g. college names).
  const max = Math.max(50, ...choices.map((choice) => String(choice).length));
  const value = readText(formData, field, { label, required: true, max });
  if (!choices.includes(value)) throw new ValidationError(`Invalid ${label}.`);
  return value;
}

/** Removes characters that could break database filter syntax. */
export function sanitizeSearch(value) {
  return String(value ?? '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .slice(0, 60);
}

/** Prevents open redirects: only same-site relative paths are allowed. */
export function safeRedirectPath(path, fallback = '/dashboard') {
  if (typeof path !== 'string') return fallback;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback;
  return path;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Keeps a file name readable but harmless (no paths, quotes or control characters). */
export function sanitizeFileName(name) {
  const cleaned = String(name || 'document')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
    .slice(-120);
  return cleaned || 'document';
}

/**
 * Validates an uploaded File: size, declared type AND real content signature.
 * Returns { buffer, mimeType, fileName }.
 */
export async function readUploadedFile(file, label = 'File') {
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function' || file.size === 0) {
    throw new ValidationError(`${label} is required.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`${label} must be 5 MB or smaller.`);
  }
  const allowed = ALLOWED_FILE_TYPES[file.type];
  if (!allowed) {
    throw new ValidationError(`${label} must be a PDF, PNG or JPG file.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const matchesSignature = allowed.signature.every((byte, index) => buffer[index] === byte);
  if (!matchesSignature) {
    throw new ValidationError(`${label} content does not match its file type.`);
  }

  return { buffer, mimeType: file.type, fileName: sanitizeFileName(file.name) };
}
