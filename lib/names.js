/**
 * Name helpers shared by the browser (forms) and the server (actions, layouts).
 */

// Accepted name suffixes: Jr., Sr. and Roman numerals II to X (with or without a trailing dot).
const SUFFIX_PATTERN = /^(jr|sr|ii|iii|iv|v|vi|vii|viii|ix|x)\.?$/i;

export const SUFFIX_EXAMPLES = 'Jr., Sr., II, III, IV';

/**
 * Proper name case: "mARY aVELAINE" -> "Mary Avelaine".
 * Every word (also after a hyphen or apostrophe) starts with a capital; the rest is lowercase.
 */
export function formatPersonName(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => separator + letter.toUpperCase());
}

/**
 * Normalizes a suffix: "jr" -> "Jr.", "iii" -> "III".
 * Returns '' when empty and null when it is not an accepted suffix.
 */
export function normalizeSuffix(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const match = text.match(SUFFIX_PATTERN);
  if (!match) return null;
  const word = match[1].toLowerCase();
  if (word === 'jr') return 'Jr.';
  if (word === 'sr') return 'Sr.';
  return word.toUpperCase();
}

/** "Juan", "Dela Cruz", "Jr." -> "Juan Dela Cruz Jr." (the suffix is left out when empty). */
export function composeFullName(firstName, lastName, suffix = '') {
  return [firstName, lastName, suffix].map((part) => String(part ?? '').trim()).filter(Boolean).join(' ');
}

/**
 * Avatar initials from the first and last name, never the suffix.
 * When only a full name is known, its last word is used as the last name unless it is a suffix.
 * `fallback` (e.g. the email) gives one letter when no name is available.
 */
export function getInitials({ firstName = '', lastName = '', fullName = '', fallback = '' } = {}) {
  const first = String(firstName ?? '').trim();
  const last = String(lastName ?? '').trim();
  if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1 && SUFFIX_PATTERN.test(parts[parts.length - 1])) parts.pop();
  if (parts.length) {
    return `${parts[0].charAt(0)}${parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''}`.toUpperCase();
  }

  const other = String(fallback ?? '').trim();
  return other ? other.charAt(0).toUpperCase() : '?';
}
