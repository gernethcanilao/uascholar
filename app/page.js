import { createClient } from '@/lib/supabase/server';
import { SCHOLARSHIP_CATEGORIES } from '@/lib/constants';
import ScholarshipCard from '@/components/ScholarshipCard/ScholarshipCard';
import SearchFilter from '@/components/SearchFilter/SearchFilter';
import EmptyState from '@/components/EmptyState/EmptyState';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

const STEPS = [
  { title: 'Create your account', text: 'Register with your school email or sign in with Google in under a minute.' },
  { title: 'Check your eligibility', text: 'Review each scholarship’s requirements and see if you qualify before applying.' },
  { title: 'Apply & track online', text: 'Upload your documents, submit, and follow your application status in real time.' },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: scholarships } = await supabase
    .from('scholarships')
    .select('id, slug, name, category, summary')
    .eq('is_active', true)
    .order('name');

  const total = scholarships?.length ?? 0;

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>University of the Assumption · Scholarship Portal</span>
            <h1 className={styles.heroTitle}>
              Your education, <span className={styles.highlight}>supported.</span>
            </h1>
            <p className={styles.heroText}>
              Find the scholarship or grant that fits you, check the requirements, and apply online — all in one place.
            </p>
            <div className={styles.heroActions}>
              <LinkButton href="/scholarships" variant="secondary" size="lg">Browse scholarships</LinkButton>
              <LinkButton href="/register" variant="ghost" size="lg">Create an account</LinkButton>
            </div>
          </div>

          <dl className={styles.heroStats}>
            <div className={styles.stat}>
              <dt>Open programs</dt>
              <dd>{total}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Categories</dt>
              <dd>{SCHOLARSHIP_CATEGORIES.length}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Paperwork</dt>
              <dd>100% online</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className={`container ${styles.searchWrap}`}>
        <SearchFilter />
      </div>

      <section className={`container ${styles.section}`} aria-labelledby="how-title">
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>How it works</span>
          <h2 id="how-title" className={styles.sectionTitle}>Three steps to your scholarship</h2>
        </div>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`container ${styles.section}`} aria-labelledby="all-title">
        <div className={styles.sectionHeadRow}>
          <div>
            <span className={styles.kicker}>Opportunities</span>
            <h2 id="all-title" className={styles.sectionTitle}>All scholarships &amp; grants</h2>
          </div>
          <LinkButton href="/scholarships" variant="outline">View all →</LinkButton>
        </div>
        {total ? (
          <div className={styles.grid}>
            {scholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        ) : (
          <EmptyState title="No scholarships yet" message="Please check back soon." />
        )}
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.cta}>
          <div>
            <h2>Ready to apply?</h2>
            <p>Create your free UA Scholar account and start your application today.</p>
          </div>
          <LinkButton href="/register" variant="secondary" size="lg">Get started</LinkButton>
        </div>
      </section>
    </>
  );
}
