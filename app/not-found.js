import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or you do not have access to it.</p>
      <Link href="/" className={styles.link}>Back to home</Link>
    </div>
  );
}
