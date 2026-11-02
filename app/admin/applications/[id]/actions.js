'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, canAccessScholarship } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptAdminData } from '@/app/_lib/aes-encryption';
import { isUuid, readText, readChoice, ValidationError } from '@/lib/validation';
import { toActionError } from '@/lib/actions';

const DECISIONS = ['approved', 'rejected'];

export async function reviewApplication(prevState, formData) {
  const { profile } = await requireAdmin();
  const applicationId = formData.get('applicationId');

  try {
    if (!isUuid(applicationId)) throw new ValidationError('Invalid application.');
    const decision = readChoice(formData, 'decision', DECISIONS, { label: 'decision' });
    const notes = readText(formData, 'notes', { label: 'Review notes', max: 2000 });

    const supabase = await createClient();

    // RLS returns nothing if this admin is not assigned to the scholarship.
    const { data: application } = await supabase
      .from('applications')
      .select('id, student_id, scholarship_id, scholarship:scholarships(name)')
      .eq('id', applicationId)
      .maybeSingle();

    if (!application || !(await canAccessScholarship(profile, application.scholarship_id))) {
      throw new ValidationError('Application not found or you do not have access to it.');
    }

    const { data: updated, error } = await supabase
      .from('applications')
      .update({
        status: decision,
        // Review notes are scholarship records: encrypted with the ADMIN key.
        review_notes_encrypted: notes ? encryptAdminData(notes, application.id) : null,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application.id)
      .select('id');

    if (error) throw error;
    if (!updated?.length) throw new ValidationError('You do not have permission to review this application.');

    await supabase.from('notifications').insert({
      user_id: application.student_id,
      title: `Application ${decision}`,
      message: `Your application for ${application.scholarship?.name ?? 'the scholarship'} has been ${decision}.`,
      link: `/student/applications/${application.id}`,
    });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath('/admin', 'layout');
  return { success: 'Review saved and the student has been notified.' };
}
