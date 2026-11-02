import { requireSuperAdmin } from '@/lib/auth';
import { createScholarship } from '../actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import ScholarshipForm from '@/components/ScholarshipForm/ScholarshipForm';
import styles from './page.module.css';

export const metadata = { title: 'Add Scholarship | UA Scholar Admin' };

export default async function NewScholarshipPage() {
  await requireSuperAdmin();

  return (
    <>
      <PageHeader title="Add Scholarship" description="Create a new scholarship or grant listing." />
      <div className={styles.card}>
        <ScholarshipForm action={createScholarship} submitLabel="Create scholarship" />
      </div>
    </>
  );
}
