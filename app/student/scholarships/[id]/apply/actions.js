'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { encryptStudentData } from '@/app/_lib/aes-encryption';
import { saveEncryptedDocument } from '@/lib/documents';
import { isUuid, readText, readNumber, readUploadedFile, ValidationError } from '@/lib/validation';
import { toActionError, pickFormValues } from '@/lib/actions';

export async function submitApplication(prevState, formData) {
  const { profile } = await requireStudent();
  const applicationId = randomUUID();

  try {
    const scholarshipId = formData.get('scholarshipId');
    if (!isUuid(scholarshipId)) throw new ValidationError('Invalid scholarship.');

    if (formData.get('confirmEligibility') !== 'on') {
      throw new ValidationError('Please confirm that you meet all eligibility requirements.');
    }

    const supabase = await createClient();
    const { data: scholarship } = await supabase
      .from('scholarships')
      .select('id, name, required_documents, is_active')
      .eq('id', scholarshipId)
      .maybeSingle();

    if (!scholarship?.is_active) throw new ValidationError('This scholarship is not accepting applications.');

    const answers = {
      reason: readText(formData, 'reason', { label: 'Reason for applying', required: true, max: 2000 }),
      monthlyFamilyIncome: readNumber(formData, 'monthlyFamilyIncome', { label: 'Monthly family income', required: true, min: 0, max: 10000000 }),
      numberOfSiblings: readNumber(formData, 'numberOfSiblings', { label: 'Number of siblings', min: 0, max: 30 }),
      achievements: readText(formData, 'achievements', { label: 'Achievements', max: 1500 }),
    };

    // Validate every file BEFORE saving anything.
    const files = [];
    for (const [index, documentType] of (scholarship.required_documents ?? []).entries()) {
      const file = await readUploadedFile(formData.get(`document_${index}`), documentType);
      files.push({ documentType, file });
    }

    const { error: insertError } = await supabase.from('applications').insert({
      id: applicationId,
      student_id: profile.id,
      scholarship_id: scholarship.id,
      form_data_encrypted: encryptStudentData(answers, profile.id),
    });

    if (insertError) {
      if (insertError.code === '23505') throw new ValidationError('You have already applied for this scholarship.');
      throw insertError;
    }

    for (const { documentType, file } of files) {
      await saveEncryptedDocument(supabase, { studentId: profile.id, applicationId, documentType, file });
    }

    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Application submitted',
      message: `Your application for ${scholarship.name} was received and is now pending review.`,
      link: `/student/applications/${applicationId}`,
    });
  } catch (error) {
    return {
      ...toActionError(error),
      values: pickFormValues(formData, ['reason', 'monthlyFamilyIncome', 'numberOfSiblings', 'achievements']),
    };
  }

  revalidatePath('/student', 'layout');
  redirect(`/student/applications/${applicationId}`);
}
