import { createClient } from '@/lib/supabase/server';
import ScholarshipCard from '@/components/ScholarshipCard/ScholarshipCard';
import SearchFilter from '@/components/SearchFilter/SearchFilter';
import EmptyState from '@/components/EmptyState/EmptyState';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

export default async function HomePage() {
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
          <h1 className={styles.heroTitle}>Scholarships and Grants at the University of the Assumption</h1>
          <p className={styles.heroText}>
            Find the scholarship that fits you, check the requirements, and apply online in one place.
          </p>
          <div className={styles.heroActions}>
            <LinkButton href="/scholarships" variant="secondary">Browse scholarships</LinkButton>
            <LinkButton href="/register" variant="outline">Create an account</LinkButton>
          </div>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <SearchFilter />

        <h2 className={styles.sectionTitle}>All Scholarships &amp; Grants</h2>
        {scholarships?.length ? (
          <div className={styles.grid}>
            {scholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        ) : (
          <EmptyState title="No scholarships yet" message="Please check back soon." />
        )}
      </section>
    </>
  );
}
