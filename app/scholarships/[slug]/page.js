import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
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
      <List className={ordered ? styles.steps : styles.list}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </List>
    </section>
  );
}

export default async function ScholarshipDetailsPage({ params }) {
  const { slug } = await params;

  // Logged-in users only (also enforced by the middleware and by database policies).
  const current = await getCurrentUser();
  if (!current) redirect(`/login?next=${encodeURIComponent(`/scholarships/${slug}`)}`);

  const supabase = await createClient();

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!scholarship) notFound();

  const eligibilityPath = `/student/scholarships/${scholarship.id}/eligibility`;

  let callToAction = null;
  if (current.profile.role === ROLES.STUDENT) {
    callToAction = <LinkButton href={eligibilityPath} size="lg">Check eligibility &amp; apply</LinkButton>;
  }

  return (
    <>
      <header className={styles.hero}>
        <div className="container">
          <Link href="/scholarships" className={styles.back}>← All scholarships</Link>
          <span className={styles.category}>{scholarship.category}</span>
          <h1 className={styles.title}>{scholarship.name}</h1>
          <p className={styles.summary}>{scholarship.summary}</p>
        </div>
      </header>

      <div className={`container ${styles.layout}`}>
        <div className={styles.main}>
          <DetailList title="Benefits" items={scholarship.benefits} />
          <DetailList title="Eligibility requirements" items={scholarship.eligibility} />
          <DetailList title="Application process" items={scholarship.application_process} ordered />
          <DetailList title="Required documents" items={scholarship.required_documents} />
        </div>

        <aside className={styles.aside}>
          <div className={styles.applyCard}>
            <h2>Apply for this program</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Category</dt>
                <dd>{scholarship.category}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd>{scholarship.deadline ? formatDate(scholarship.deadline) : 'Open'}</dd>
              </div>
              {scholarship.required_documents?.length > 0 && (
                <div>
                  <dt>Documents</dt>
                  <dd>{scholarship.required_documents.length} required</dd>
                </div>
              )}
            </dl>
            {callToAction && <div className={styles.applyAction}>{callToAction}</div>}
          </div>
        </aside>
      </div>
    </>
  );
}
