'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptStudentData } from '@/app/_lib/aes-encryption';
import { readText, readChoice, ValidationError } from '@/lib/validation';
import { YEAR_LEVELS, COURSES } from '@/lib/constants';
import { toActionError, pickFormValues } from '@/lib/actions';

const FORM_FIELDS = ['fullName', 'studentNumber', 'phone', 'birthdate', 'address', 'course', 'yearLevel'];

export async function updateStudentProfile(prevState, formData) {
  const { profile } = await requireStudent();

  try {
    const fullName = readText(formData, 'fullName', { label: 'Full name', required: true, max: 150 });

    const personal = {
      studentNumber: readText(formData, 'studentNumber', { label: 'Student number', required: true, max: 30 }),
      phone: readText(formData, 'phone', { label: 'Contact number', required: true, max: 20 }),
      birthdate: readText(formData, 'birthdate', { label: 'Birthdate', max: 10 }),
      address: readText(formData, 'address', { label: 'Address', max: 300 }),
    };

    if (!/^[0-9+\-\s()]{7,20}$/.test(personal.phone)) {
      throw new ValidationError('Please enter a valid contact number.');
    }
    if (personal.birthdate && Number.isNaN(Date.parse(personal.birthdate))) {
      throw new ValidationError('Please enter a valid birthdate.');
    }

    const academic = {
      course: readChoice(formData, 'course', COURSES, { label: 'course' }),
      yearLevel: readChoice(formData, 'yearLevel', YEAR_LEVELS, { label: 'year level' }),
    };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        // Sensitive data is AES-encrypted before it reaches the database.
        personal_data_encrypted: encryptStudentData(personal, profile.id),
        academic_data_encrypted: encryptStudentData(academic, profile.id),
      })
      .eq('id', profile.id)
      .select('id');

    if (error) {
      console.error('Profile update failed:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
      if (error.code === '42501') {
        throw new ValidationError('The database did not allow this update (permission denied). Please contact the administrator.');
      }
      throw error;
    }
    // RLS can silently match zero rows; never report success when nothing was saved.
    if (!data?.length) throw new ValidationError('Your profile could not be saved. Please log out and log in again.');
  } catch (error) {
    return {
      ...toActionError(error),
      values: pickFormValues(formData, FORM_FIELDS),
    };
  }

  revalidatePath('/student', 'layout');
  return { success: 'Your profile has been saved.' };
}
