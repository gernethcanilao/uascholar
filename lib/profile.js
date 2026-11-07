import 'server-only';
import { decryptStudentData } from '@/app/_lib/aes-encryption';
import { coursesForCollege } from './constants';

const EMPTY_PERSONAL = { firstName: '', lastName: '', studentNumber: '', phone: '', birthdate: '', address: '' };
// gwa is no longer edited in My Profile, but older profiles may still hold it (shown to reviewers).
const EMPTY_ACADEMIC = { college: '', course: '', yearLevel: '', gwa: '' };

/** Decrypts the personal and academic sections of a profile row. */
export function decryptStudentProfile(profileRow) {
  return {
    personal: { ...EMPTY_PERSONAL, ...decryptStudentData(profileRow?.personal_data_encrypted, profileRow?.id, {}) },
    academic: { ...EMPTY_ACADEMIC, ...decryptStudentData(profileRow?.academic_data_encrypted, profileRow?.id, {}) },
  };
}

/**
 * First and last name for the profile form.
 * Order: saved profile -> values given at registration (auth metadata) -> split of the older full_name.
 */
export function resolveNames(personal, user, fullName = '') {
  const meta = user?.user_metadata ?? {};
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: personal.firstName || meta.first_name || (parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? ''),
    lastName: personal.lastName || meta.last_name || (parts.length > 1 ? parts[parts.length - 1] : ''),
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
