'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid, readText } from '@/lib/validation';
import { toActionError, pickFormValues } from '@/lib/actions';

export async function createAnnouncement(prevState, formData) {
  const { profile } = await requireAdmin();

  try {
    const title = readText(formData, 'title', { label: 'Title', required: true, max: 150 });
    const body = readText(formData, 'body', { label: 'Message', required: true, max: 3000 });

    const supabase = await createClient();
    const { error } = await supabase.from('announcements').insert({ title, body, created_by: profile.id });
    if (error) throw error;
  } catch (error) {
    return { ...toActionError(error), values: pickFormValues(formData, ['title', 'body']) };
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
