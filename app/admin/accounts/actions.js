'use server';

import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid, readChoice, ValidationError } from '@/lib/validation';
import { ROLES } from '@/lib/constants';
import { toActionError } from '@/lib/actions';

const ROLE_VALUES = Object.values(ROLES);

/** Changes a user's role or active status. Only super admins (also enforced by the DB trigger). */
export async function updateAccount(prevState, formData) {
  const { profile } = await requireSuperAdmin();

  try {
    const userId = formData.get('userId');
    if (!isUuid(userId)) throw new ValidationError('Invalid account.');
    if (userId === profile.id) throw new ValidationError('You cannot change your own role or status.');

    const intent = readChoice(formData, 'intent', ['role', 'status'], { label: 'action' });
    const changes = intent === 'role'
      ? { role: readChoice(formData, 'role', ROLE_VALUES, { label: 'role' }) }
      : { is_active: formData.get('isActive') === 'true' };

    const supabase = await createClient();
    const { data, error } = await supabase.from('profiles').update(changes).eq('id', userId).select('id');
    if (error) throw error;
    if (!data?.length) throw new ValidationError('Account not found.');

    // A user who is no longer an admin should not keep scholarship assignments.
    if (changes.role && changes.role !== ROLES.ADMIN) {
      await supabase.from('admin_assignments').delete().eq('admin_id', userId);
    }
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/admin/accounts');
  return { success: 'Saved.' };
}

/** Gives a scholarship admin access to one scholarship. */
export async function assignScholarship(prevState, formData) {
  await requireSuperAdmin();

  try {
    const adminId = formData.get('adminId');
    const scholarshipId = formData.get('scholarshipId');
    if (!isUuid(adminId) || !isUuid(scholarshipId)) throw new ValidationError('Please choose an admin and a scholarship.');

    const supabase = await createClient();
    const { data: admin } = await supabase.from('profiles').select('role').eq('id', adminId).maybeSingle();
    if (admin?.role !== ROLES.ADMIN) throw new ValidationError('Assignments are only for scholarship admins.');

    const { error } = await supabase.from('admin_assignments').insert({ admin_id: adminId, scholarship_id: scholarshipId });
    if (error?.code === '23505') throw new ValidationError('This admin is already assigned to that scholarship.');
    if (error) throw error;
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/admin/accounts');
  return { success: 'Scholarship assigned.' };
}

export async function removeAssignment(formData) {
  await requireSuperAdmin();
  const adminId = formData.get('adminId');
  const scholarshipId = formData.get('scholarshipId');
  if (!isUuid(adminId) || !isUuid(scholarshipId)) return;

  const supabase = await createClient();
  await supabase.from('admin_assignments').delete().eq('admin_id', adminId).eq('scholarship_id', scholarshipId);
  revalidatePath('/admin/accounts');
}
