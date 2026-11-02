export const SCHOLARSHIP_CATEGORIES = ['Academic', 'Grant', 'Talent', 'Athletic'];

export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];

export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_LABELS = {
  student: 'Student',
  admin: 'Scholarship Admin',
  super_admin: 'Super Admin',
};

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Senior High School'];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Allowed upload types and their "magic number" signatures. */
export const ALLOWED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'image/png': { extension: 'png', signature: [0x89, 0x50, 0x4e, 0x47] },
  'image/jpeg': { extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
};
