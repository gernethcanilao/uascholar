import Link from 'next/link';
import styles from './ScholarshipCard.module.css';

export default function ScholarshipCard({ scholarship }) {
  const tone = styles[scholarship.category?.toLowerCase()] ?? '';

  return (
    <article className={`${styles.card} ${tone}`}>
      <div className={styles.top}>
        <span className={styles.category}>{scholarship.category}</span>
      </div>
      <h3 className={styles.title}>
        <Link href={`/scholarships/${scholarship.slug}`} className={styles.titleLink}>
          {scholarship.name}
        </Link>
      </h3>
      <p className={styles.summary}>{scholarship.summary}</p>
      <span className={styles.link} aria-hidden="true">
        View details <span className={styles.arrow}>→</span>
      </span>
    </article>
  );
}
