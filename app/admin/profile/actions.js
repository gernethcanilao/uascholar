'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptAdminData } from '@/app/_lib/aes-encryption';
import { readText, ValidationError } from '@/lib/validation';
import { toActionError } from '@/lib/actions';

export async function updateAdminProfile(prevState, formData) {
  const { profile } = await requireAdmin();

  try {
    const fullName = readText(formData, 'fullName', { label: 'Full name', required: true, max: 150 });
    const details = {
      position: readText(formData, 'position', { label: 'Position', max: 100 }),
      office: readText(formData, 'office', { label: 'Office', max: 150 }),
      phone: readText(formData, 'phone', { label: 'Contact number', max: 20 }),
    };

    if (details.phone && !/^[0-9+\-\s()]{7,20}$/.test(details.phone)) {
      throw new ValidationError('Please enter a valid contact number.');
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        // Admin account details are encrypted with the ADMIN key.
        admin_data_encrypted: encryptAdminData(details, profile.id),
      })
      .eq('id', profile.id);

    if (error) throw error;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/admin', 'layout');
  return { success: 'Account details saved.' };
}
