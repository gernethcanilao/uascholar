'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function markAllNotificationsRead() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', profile.id)
    .eq('is_read', false);

  revalidatePath('/student', 'layout');
}
