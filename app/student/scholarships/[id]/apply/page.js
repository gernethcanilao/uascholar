import { notFound, redirect } from 'next/navigation';
import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import { decryptStudentProfile, isProfileComplete } from '@/lib/profile';
import PageHeader from '@/components/PageHeader/PageHeader';
import ApplicationForm from '@/components/ApplicationForm/ApplicationForm';
import EmptyState from '@/components/EmptyState/EmptyState';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

export const metadata = { title: 'Apply | UA Scholar' };

export default async function ApplyPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { profile } = await requireStudent();
  const supabase = await createClient();

  const [{ data: scholarship }, { data: existing }, { data: profileRow }] = await Promise.all([
    supabase
      .from('scholarships')
      .select('id, name, required_documents')
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('applications')
      .select('id')
      .eq('scholarship_id', id)
      .eq('student_id', profile.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, personal_data_encrypted, academic_data_encrypted')
      .eq('id', profile.id)
      .single(),
  ]);

  if (!scholarship) notFound();
  if (existing) redirect(`/student/applications/${existing.id}`);

  const profileComplete = isProfileComplete(decryptStudentProfile(profileRow));

  return (
    <>
      <PageHeader title="Scholarship Application" description={scholarship.name} />

      {profileComplete ? (
        <div className={styles.card}>
          <ApplicationForm scholarshipId={scholarship.id} requiredDocuments={scholarship.required_documents} />
        </div>
      ) : (
        <EmptyState
          title="Complete your profile first"
          message="Your student number, contact number, course and year level are needed before you can apply."
        >
          <LinkButton href="/student/profile">Go to my profile</LinkButton>
        </EmptyState>
      )}
    </>
  );
}
