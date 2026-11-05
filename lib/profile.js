import 'server-only';
import { decryptStudentData } from '@/app/_lib/aes-encryption';

const EMPTY_PERSONAL = { studentNumber: '', phone: '', birthdate: '', address: '' };
const EMPTY_ACADEMIC = { course: '', yearLevel: '' };

/** Decrypts the personal and academic sections of a profile row. */
export function decryptStudentProfile(profileRow) {
  return {
    personal: { ...EMPTY_PERSONAL, ...decryptStudentData(profileRow?.personal_data_encrypted, profileRow?.id, {}) },
    academic: { ...EMPTY_ACADEMIC, ...decryptStudentData(profileRow?.academic_data_encrypted, profileRow?.id, {}) },
  };
}

/** A student must fill in the basic fields before applying. */
export function isProfileComplete({ personal, academic }) {
  return Boolean(personal.studentNumber && personal.phone && academic.course && academic.yearLevel);
}
