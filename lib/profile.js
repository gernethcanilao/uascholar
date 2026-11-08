import 'server-only';
import { decryptStudentData } from '@/app/_lib/aes-encryption';
import { coursesForCollege, UA_COLLEGES, LEGACY_COLLEGE_NAMES, LEGACY_PROGRAM_NAMES } from './constants';

const EMPTY_PERSONAL = { firstName: '', lastName: '', suffix: '', studentNumber: '', phone: '', birthdate: '', address: '' };
// gwa is no longer edited in My Profile, but older profiles may still hold it (shown to reviewers).
const EMPTY_ACADEMIC = { college: '', course: '', yearLevel: '', gwa: '' };

/**
 * Maps an older college/program name to its current full name, but only when there is an exact match
 * AND the program belongs to that college. Anything else is returned unchanged (never guessed).
 */
export function upgradeAcademicNames(academic) {
  const college = LEGACY_COLLEGE_NAMES[academic.college] ?? academic.college;
  const course = LEGACY_PROGRAM_NAMES[academic.course] ?? academic.course;
  const isValid = UA_COLLEGES.includes(college)
    && (!course || coursesForCollege(college).some((item) => item.name === course));
  return isValid ? { ...academic, college, course } : academic;
}

/** Decrypts the personal and academic sections of a profile row. */
export function decryptStudentProfile(profileRow) {
  const academic = { ...EMPTY_ACADEMIC, ...decryptStudentData(profileRow?.academic_data_encrypted, profileRow?.id, {}) };
  return {
    personal: { ...EMPTY_PERSONAL, ...decryptStudentData(profileRow?.personal_data_encrypted, profileRow?.id, {}) },
    academic: upgradeAcademicNames(academic),
  };
}

/**
 * First name, last name and suffix for the profile form and avatar.
 * Order: saved profile -> values given at registration (auth metadata) -> split of the older full_name.
 */
export function resolveNames(personal, user, fullName = '') {
  const meta = user?.user_metadata ?? {};
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  // Once the profile has been saved, its suffix wins even when empty (the student may have cleared it).
  const hasSavedProfile = Boolean(personal.firstName || personal.lastName);
  return {
    firstName: personal.firstName || meta.first_name || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? ''),
    lastName: personal.lastName || meta.last_name || (parts.length > 1 ? parts[parts.length - 1] : ''),
    suffix: hasSavedProfile ? personal.suffix || '' : meta.suffix || '',
  };
}

/** A student must fill in the basic fields before applying. */
export function isProfileComplete({ personal, academic }) {
  const needsCourse = coursesForCollege(academic.college).length > 0;
  return Boolean(
    personal.studentNumber &&
      personal.phone &&
      academic.college &&
      academic.yearLevel &&
      (!needsCourse || academic.course)
  );
}
