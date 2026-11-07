'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptStudentData } from '@/app/_lib/aes-encryption';
import { decryptStudentProfile } from '@/lib/profile';
import { readText, readChoice, ValidationError } from '@/lib/validation';
import { YEAR_LEVELS, UA_COLLEGES, coursesForCollege } from '@/lib/constants';
import { toActionError, pickFormValues } from '@/lib/actions';

const FORM_FIELDS = ['firstName', 'lastName', 'studentNumber', 'phone', 'birthdate', 'address', 'college', 'course', 'yearLevel'];

export async function updateStudentProfile(prevState, formData) {
  const { profile } = await requireStudent();

  try {
    const firstName = readText(formData, 'firstName', { label: 'First name', required: true, max: 75 });
    const lastName = readText(formData, 'lastName', { label: 'Last name', required: true, max: 75 });

    const personal = {
      firstName,
      lastName,
      studentNumber: readText(formData, 'studentNumber', { label: 'Student number', required: true, max: 30 }),
      phone: readText(formData, 'phone', { label: 'Contact number', required: true, max: 20 }),
      birthdate: readText(formData, 'birthdate', { label: 'Birthdate', max: 10 }),
      address: readText(formData, 'address', { label: 'Address', max: 300 }),
    };

    if (!/^[0-9+\-\s()]{7,20}$/.test(personal.phone)) {
      throw new ValidationError('Please enter a valid contact number (7 to 20 digits, e.g. 09171234567).');
    }
    if (personal.birthdate && Number.isNaN(Date.parse(personal.birthdate))) {
      throw new ValidationError('Please enter a valid birthdate.');
    }

    const college = readChoice(formData, 'college', UA_COLLEGES, { label: 'college/program' });
    // The Course list depends on the college; colleges without approved courses yet have no course.
    const courseOptions = coursesForCollege(college).map((course) => course.name);
    const course = courseOptions.length ? readChoice(formData, 'course', courseOptions, { label: 'course' }) : '';

    const supabase = await createClient();

    // Keep a GWA saved by older versions of the form (reviewers may still see it); it is no longer edited here.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, academic_data_encrypted')
      .eq('id', profile.id)
      .single();
    const previousGwa = decryptStudentProfile(existing).academic.gwa;

    const academic = {
      college,
      course,
      yearLevel: readChoice(formData, 'yearLevel', YEAR_LEVELS, { label: 'year level' }),
      ...(previousGwa !== '' && previousGwa != null ? { gwa: previousGwa } : {}),
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: `${firstName} ${lastName}`,
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
