import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import ScholarshipCard from '@/components/ScholarshipCard/ScholarshipCard';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Scholarships | UA Scholar' };

export default async function ScholarshipsPage() {
  // Logged-in users only (also enforced by the middleware and by database policies).
  const current = await getCurrentUser();
  if (!current) redirect('/login?next=/scholarships');

  const supabase = await createClient();
  const { data: scholarships } = await supabase
    .from('scholarships')
    .select('id, slug, name, category, summary')
    .eq('is_active', true)
    .order('name');

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>Browse scholarships</h1>
          <p className={styles.subtitle}>View the scholarships and grants currently open at the University of the Assumption.</p>
        </div>
      </section>

      <div className={`container ${styles.page}`}>
        {scholarships?.length ? (
          <div className={styles.grid}>
            {scholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        ) : (
          <EmptyState title="No scholarships available" message="Please check back soon." />
        )}
      </div>
    </>
  );
}
