'use server';

import { revalidatePath } from 'next/cache';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { saveEncryptedDocument } from '@/lib/documents';
import { isUuid, readText, readUploadedFile, ValidationError } from '@/lib/validation';
import { toActionError } from '@/lib/actions';

/** Lets a student add a missing or extra document while the application is still pending. */
export async function uploadAdditionalDocument(prevState, formData) {
  const { profile } = await requireStudent();
  const applicationId = formData.get('applicationId');

  try {
    if (!isUuid(applicationId)) throw new ValidationError('Invalid application.');

    const documentType = readText(formData, 'documentType', { label: 'Document name', required: true, max: 100 });
    const file = await readUploadedFile(formData.get('file'), 'Document');

    const supabase = await createClient();
    const { data: application } = await supabase
      .from('applications')
      .select('id, status')
      .eq('id', applicationId)
      .eq('student_id', profile.id)
      .maybeSingle();

    if (!application) throw new ValidationError('Application not found.');
    if (application.status !== 'pending') {
      throw new ValidationError('Documents can only be added while the application is pending.');
    }

    await saveEncryptedDocument(supabase, { studentId: profile.id, applicationId, documentType, file });
  } catch (error) {
    return toActionError(error);
  }

  revalidatePath(`/student/applications/${applicationId}`);
  return { success: 'Document uploaded successfully.' };
}
