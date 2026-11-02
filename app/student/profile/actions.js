'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptStudentData } from '@/app/_lib/aes-encryption';
import { readText, readNumber, readChoice, ValidationError } from '@/lib/validation';
import { YEAR_LEVELS } from '@/lib/constants';
import { toActionError } from '@/lib/actions';

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
      course: readText(formData, 'course', { label: 'Course / Program', required: true, max: 150 }),
      yearLevel: readChoice(formData, 'yearLevel', YEAR_LEVELS, { label: 'year level' }),
      gwa: readNumber(formData, 'gwa', { label: 'GWA', min: 1, max: 100 }),
    };

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        // Sensitive data is AES-encrypted before it reaches the database.
        personal_data_encrypted: encryptStudentData(personal, profile.id),
        academic_data_encrypted: encryptStudentData(academic, profile.id),
      })
      .eq('id', profile.id);

    if (error) throw error;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/student', 'layout');
  return { success: 'Your profile has been saved.' };
}
