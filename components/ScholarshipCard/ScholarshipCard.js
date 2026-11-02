import Link from 'next/link';
import styles from './ScholarshipCard.module.css';

export default function ScholarshipCard({ scholarship }) {
  return (
    <article className={styles.card}>
      <span className={`${styles.category} ${styles[scholarship.category?.toLowerCase()] ?? ''}`}>
        {scholarship.category}
      </span>
      <h3 className={styles.title}>{scholarship.name}</h3>
      <p className={styles.summary}>{scholarship.summary}</p>
      <Link href={`/scholarships/${scholarship.slug}`} className={styles.link}>
        View details →
      </Link>
    </article>
  );
}
