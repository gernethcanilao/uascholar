'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, canAccessScholarship } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid, readText, ValidationError } from '@/lib/validation';
import { ROLES } from '@/lib/constants';
import { toActionError, pickFormValues } from '@/lib/actions';

export async function createAnnouncement(prevState, formData) {
  const { profile } = await requireAdmin();

  try {
    const title = readText(formData, 'title', { label: 'Title', required: true, max: 150 });
    const body = readText(formData, 'body', { label: 'Message', required: true, max: 3000 });

    // Which scholarship the announcement is for (scholarship admins only; super admins post as General Admin).
    // Checked here for a clear message; the database trigger checks it again and sets the source label.
    let scholarshipId = null;
    if (profile.role === ROLES.ADMIN) {
      const value = formData.get('scholarshipId');
      if (!isUuid(value)) throw new ValidationError('Please choose which scholarship this announcement is for.');
      if (!(await canAccessScholarship(profile, value))) {
        throw new ValidationError('You can only post announcements for scholarships assigned to you.');
      }
      scholarshipId = value;
    }

    const supabase = await createClient();
    // scholarship_id is only sent when there is one, so General Admin posts never depend on that column.
    const { error } = await supabase
      .from('announcements')
      .insert({ title, body, created_by: profile.id, ...(scholarshipId ? { scholarship_id: scholarshipId } : {}) });
    if (error) throw error;
  } catch (error) {
    return { ...toActionError(error), values: pickFormValues(formData, ['title', 'body', 'scholarshipId']) };
  }

  revalidatePath('/admin/announcements');
  revalidatePath('/student/notifications');
  return { success: 'Announcement published to all students.' };
}

export async function deleteAnnouncement(formData) {
  await requireAdmin();
  const id = formData.get('id');
  if (!isUuid(id)) return;

  const supabase = await createClient();
  // RLS: only the author or a super admin can delete.
  await supabase.from('announcements').delete().eq('id', id);

  revalidatePath('/admin/announcements');
  revalidatePath('/student/notifications');
}
