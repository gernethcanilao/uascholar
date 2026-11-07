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
 * University of the Assumption academic units (College/Program dropdown in My Profile).
 * Source: "Degrees and programs offered", https://en.wikipedia.org/wiki/University_of_the_Assumption
 * (the College of Engineering and Architecture also appears on ua.edu.ph). Update here when the
 * official list from the UA Registrar is available.
 */
export const UA_COLLEGES = [
  'College of Accountancy',
  'School of Business and Public Administration',
  'College of Hospitality and Tourism Management',
  'School of Education',
  'College of Engineering and Architecture',
  'College of Computing Sciences and Information Technology',
  'School of Arts and Sciences',
  'College of Nursing and Pharmacy',
  'Institute of Theology and Religious Studies',
];

/**
 * Approved courses for the Course dropdown (only these five for now), each linked to its college.
 * Add more entries here later; the profile form and validation read from this list.
 */
export const UA_COURSES = [
  { name: 'BS in Information Technology', college: 'College of Computing Sciences and Information Technology' },
  { name: 'BS in Architecture', college: 'College of Engineering and Architecture' },
  { name: 'BS in Computer Engineering', college: 'College of Engineering and Architecture' },
  { name: 'BS in Industrial Engineering', college: 'College of Engineering and Architecture' },
  { name: 'BS in Civil Engineering', college: 'College of Engineering and Architecture' },
];

export const coursesForCollege = (college) => UA_COURSES.filter((course) => course.college === college);
