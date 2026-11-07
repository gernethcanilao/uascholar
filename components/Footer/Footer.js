import Link from 'next/link';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import styles from './Footer.module.css';

export default async function Footer() {
  const current = await getCurrentUser();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandCol}>
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">UA</span>
            <span>UA Scholar</span>
          </div>
          <p className={styles.tagline}>
            The official scholarship and grants portal of the University of the Assumption.
          </p>
        </div>

        <nav className={styles.col} aria-label="Explore">
          <h2 className={styles.heading}>Explore</h2>
          <Link href="/">Home</Link>
        </nav>

        <nav className={styles.col} aria-label="Account">
          <h2 className={styles.heading}>Account</h2>
          {current ? (
            <Link href={dashboardPathFor(current.profile.role)}>My dashboard</Link>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register">Create an account</Link>
            </>
          )}
        </nav>

        <div className={styles.col}>
          <h2 className={styles.heading}>Visit us</h2>
          <span>University of the Assumption</span>
          <span>City of San Fernando, Pampanga</span>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} University of the Assumption. All rights reserved.</span>
      </div>
    </footer>
  );
}
