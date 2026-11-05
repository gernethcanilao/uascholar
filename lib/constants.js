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

/** Only students with a University of the Assumption email may use the portal. */
export const UA_EMAIL_DOMAIN = 'ua.edu.ph';

/**
 * Courses offered by the University of the Assumption, grouped by college.
 * Single place to maintain the "Course / Program" dropdown in My Profile.
 */
export const COURSE_GROUPS = [
  {
    college: 'College of Accountancy',
    courses: ['BS Accountancy', 'BS Accounting Information System'],
  },
  {
    college: 'College of Engineering and Architecture',
    courses: [
      'BS Architecture',
      'BS Civil Engineering',
      'BS Computer Engineering',
      'BS Electronics Engineering',
      'BS Industrial Engineering',
    ],
  },
  {
    college: 'College of Hospitality and Tourism Management',
    courses: ['BS Hospitality Management', 'BS Tourism Management'],
  },
  {
    college: 'College of Information Technology',
    courses: ['BS Computer Science', 'BS Information Technology', 'Bachelor of Library and Information Science'],
  },
  {
    college: 'College of Nursing and Pharmacy',
    courses: ['BS Nursing', 'BS Pharmacy'],
  },
  {
    college: 'School of Arts and Sciences',
    courses: ['AB Communication', 'Bachelor in Human Services', 'BS Criminology', 'BS Psychology'],
  },
  {
    college: 'School of Business and Public Administration',
    courses: [
      'BS Business Administration major in Marketing Management',
      'BS Business Administration major in Operations Management',
    ],
  },
  {
    college: 'School of Education',
    courses: [
      'Bachelor of Early Childhood Education',
      'Bachelor of Elementary Education',
      'Bachelor of Physical Education',
      'Bachelor of Secondary Education major in English',
      'Bachelor of Secondary Education major in Mathematics',
      'Bachelor of Secondary Education major in Values Education',
    ],
  },
];

export const COURSES = COURSE_GROUPS.flatMap((group) => group.courses);

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Allowed upload types and their "magic number" signatures. */
export const ALLOWED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', signature: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'image/png': { extension: 'png', signature: [0x89, 0x50, 0x4e, 0x47] },
  'image/jpeg': { extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
};
