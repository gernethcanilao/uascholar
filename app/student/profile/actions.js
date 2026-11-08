'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptStudentData } from '@/app/_lib/aes-encryption';
import { decryptStudentProfile } from '@/lib/profile';
import { YEAR_LEVELS, UA_COLLEGES, coursesForCollege } from '@/lib/constants';
import { formatPersonName, normalizeSuffix, composeFullName, SUFFIX_EXAMPLES } from '@/lib/names';
import { toActionError, pickFormValues } from '@/lib/actions';

const FORM_FIELDS = ['firstName', 'lastName', 'suffix', 'studentNumber', 'phone', 'birthdate', 'address', 'college', 'course', 'yearLevel'];

const text = (formData, field) => String(formData.get(field) ?? '').trim();

/** Checks every field and returns { values, fieldErrors } so each problem can be shown next to its field. */
function readProfileForm(formData) {
  const fieldErrors = {};
  const values = {
    firstName: formatPersonName(formData.get('firstName')),
    lastName: formatPersonName(formData.get('lastName')),
    suffix: normalizeSuffix(formData.get('suffix')),
    studentNumber: text(formData, 'studentNumber'),
    phone: text(formData, 'phone'),
    birthdate: text(formData, 'birthdate'),
    address: text(formData, 'address'),
    college: text(formData, 'college'),
    course: text(formData, 'course'),
    yearLevel: text(formData, 'yearLevel'),
  };

  if (!values.firstName) fieldErrors.firstName = 'First name is required.';
  else if (values.firstName.length > 75) fieldErrors.firstName = 'First name must be 75 characters or less.';
  if (!values.lastName) fieldErrors.lastName = 'Last name is required.';
  else if (values.lastName.length > 75) fieldErrors.lastName = 'Last name must be 75 characters or less.';
  if (values.suffix === null) fieldErrors.suffix = `Use a suffix such as ${SUFFIX_EXAMPLES}, or leave it blank.`;

  if (!values.studentNumber) fieldErrors.studentNumber = 'Student number is required.';
  else if (values.studentNumber.length > 30) fieldErrors.studentNumber = 'Student number must be 30 characters or less.';

  if (!values.phone) fieldErrors.phone = 'Contact number is required.';
  else if (!/^[0-9+\-\s()]{7,20}$/.test(values.phone)) {
    fieldErrors.phone = 'Please enter a valid contact number (7 to 20 digits, e.g. 09171234567).';
  }

  if (values.birthdate && (values.birthdate.length > 10 || Number.isNaN(Date.parse(values.birthdate)))) {
    fieldErrors.birthdate = 'Please enter a valid birthdate.';
  }
  if (values.address.length > 300) fieldErrors.address = 'Address must be 300 characters or less.';

  // College and Program must be a valid pair from the official list.
  if (!values.college) fieldErrors.college = 'College is required.';
  else if (!UA_COLLEGES.includes(values.college)) fieldErrors.college = 'Please select a college from the list.';
  else if (!values.course) fieldErrors.course = 'Program is required.';
  else if (!coursesForCollege(values.college).some((item) => item.name === values.course)) {
    fieldErrors.course = 'Please select a program that belongs to the selected college.';
  }

  if (!values.yearLevel) fieldErrors.yearLevel = 'Year level is required.';
  else if (!YEAR_LEVELS.includes(values.yearLevel)) fieldErrors.yearLevel = 'Please select a year level from the list.';

  return { values, fieldErrors };
}

export async function updateStudentProfile(prevState, formData) {
  const { profile } = await requireStudent();

  try {
    const { values, fieldErrors } = readProfileForm(formData);
    if (Object.keys(fieldErrors).length) {
      return {
        error: 'Please complete the highlighted fields.',
        fieldErrors,
        values: pickFormValues(formData, FORM_FIELDS),
      };
    }

    const { firstName, lastName, suffix } = values;
    const personal = {
      firstName,
      lastName,
      suffix,
      studentNumber: values.studentNumber,
      phone: values.phone,
      birthdate: values.birthdate,
      address: values.address,
    };

    const supabase = await createClient();

    // Keep a GWA saved by older versions of the form (reviewers may still see it); it is no longer edited here.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, academic_data_encrypted')
      .eq('id', profile.id)
      .single();
    const previousGwa = decryptStudentProfile(existing).academic.gwa;

    const academic = {
      college: values.college,
      course: values.course,
      yearLevel: values.yearLevel,
      ...(previousGwa !== '' && previousGwa != null ? { gwa: previousGwa } : {}),
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: composeFullName(firstName, lastName, suffix),
        // Sensitive data is AES-encrypted before it reaches the database.
        personal_data_encrypted: encryptStudentData(personal, profile.id),
        academic_data_encrypted: encryptStudentData(academic, profile.id),
      })
      .eq('id', profile.id);

    if (error) throw error;
  } catch (error) {
    // Send the typed values back so the form keeps them after an error.
    return { ...toActionError(error), values: pickFormValues(formData, FORM_FIELDS) };
  }

  revalidatePath('/student', 'layout');
  return { success: 'Your profile has been saved.' };
}
