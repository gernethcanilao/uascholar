import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { ROLES } from '@/lib/constants';
import LinkButton from '@/components/LinkButton/LinkButton';
import styles from './page.module.css';

function DetailList({ title, items, ordered = false }) {
  if (!items?.length) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <section className={styles.block}>
      <h2>{title}</h2>
      <List className={styles.list}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </List>
    </section>
  );
}

export default async function ScholarshipDetailsPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!scholarship) notFound();

  const current = await getCurrentUser();
  const eligibilityPath = `/student/scholarships/${scholarship.id}/eligibility`;

  let callToAction = null;
  if (!current) {
    callToAction = <LinkButton href={`/login?next=${encodeURIComponent(eligibilityPath)}`}>Log in to apply</LinkButton>;
  } else if (current.profile.role === ROLES.STUDENT) {
    callToAction = <LinkButton href={eligibilityPath}>Check eligibility &amp; apply</LinkButton>;
  }

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <span className={styles.category}>{scholarship.category}</span>
        <h1>{scholarship.name}</h1>
        <p className={styles.summary}>{scholarship.summary}</p>
        {scholarship.deadline && (
          <p className={styles.deadline}>Application deadline: <strong>{formatDate(scholarship.deadline)}</strong></p>
        )}
        {callToAction}
      </header>

      <div className={styles.grid}>
        <DetailList title="Benefits" items={scholarship.benefits} />
        <DetailList title="Eligibility Requirements" items={scholarship.eligibility} />
        <DetailList title="Application Process" items={scholarship.application_process} ordered />
        <DetailList title="Required Documents" items={scholarship.required_documents} />
      </div>
    </div>
  );
}
