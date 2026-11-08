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

/**
 * University of the Assumption colleges/schools and their programs (My Profile > Academic Information).
 * Program names are written in full on purpose; do not abbreviate them.
 */
const UA_PROGRAMS_BY_COLLEGE = {
  'School of Arts and Sciences': [
    'Bachelor of Arts in Communication',
    'Bachelor of Science in Criminology',
    'Bachelor of Science in Human Services',
    'Bachelor of Science in Psychology',
  ],
  'College of Accountancy': [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Accounting Information System',
  ],
  'School of Business and Public Administration': [
    'Bachelor of Science in Business Administration',
    'Bachelor of Science in Hospitality Management',
    'Bachelor of Science in Tourism Management',
  ],
  'College of Engineering and Architecture': [
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Computer Engineering',
    'Bachelor of Science in Industrial Engineering',
    'Bachelor of Science in Architecture',
  ],
  'College of Information Technology': [
    'Bachelor of Science in Information Technology',
  ],
  'College of Nursing and Pharmacy': [
    'Bachelor of Science in Nursing',
    'Bachelor of Science in Pharmacy',
  ],
  'School of Education': [
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
  ],
};

export const UA_COLLEGES = Object.keys(UA_PROGRAMS_BY_COLLEGE);

/** Every program with its college. (Stored in the profile under the existing "course" key.) */
export const UA_COURSES = UA_COLLEGES.flatMap((college) =>
  UA_PROGRAMS_BY_COLLEGE[college].map((name) => ({ name, college }))
);

/**
 * Older saved values that have an exact new equivalent. Values not listed here are kept as they are
 * (never guessed); the profile form then asks the student to choose again.
 */
export const LEGACY_COLLEGE_NAMES = {
  'College of Computing Sciences and Information Technology': 'College of Information Technology',
};
export const LEGACY_PROGRAM_NAMES = {
  'BS in Information Technology': 'Bachelor of Science in Information Technology',
  'BS in Architecture': 'Bachelor of Science in Architecture',
  'BS in Computer Engineering': 'Bachelor of Science in Computer Engineering',
  'BS in Industrial Engineering': 'Bachelor of Science in Industrial Engineering',
  'BS in Civil Engineering': 'Bachelor of Science in Civil Engineering',
};

export const coursesForCollege = (college) => UA_COURSES.filter((course) => course.college === college);
