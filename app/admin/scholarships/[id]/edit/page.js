import { notFound } from 'next/navigation';
import { requireAdmin, canAccessScholarship } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import { updateScholarship } from '../../actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import ScholarshipForm from '@/components/ScholarshipForm/ScholarshipForm';
import styles from './page.module.css';

export const metadata = { title: 'Edit Scholarship | UA Scholar Admin' };

export default async function EditScholarshipPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { profile } = await requireAdmin();
  // Scholarship Admins can only edit scholarships assigned to them (saving is also blocked by RLS).
  if (!(await canAccessScholarship(profile, id))) notFound();

  const supabase = await createClient();

  const { data: scholarship } = await supabase.from('scholarships').select('*').eq('id', id).maybeSingle();
  if (!scholarship) notFound();

  return (
    <>
      <PageHeader title="Edit Scholarship" description={scholarship.name} />
      <div className={styles.card}>
        <ScholarshipForm action={updateScholarship} scholarship={scholarship} submitLabel="Save changes" />
      </div>
    </>
  );
}
