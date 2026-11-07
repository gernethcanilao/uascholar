import Link from 'next/link';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import NavMenu from './NavMenu';
import styles from './Navbar.module.css';

export default async function Navbar() {
  const current = await getCurrentUser();
  const dashboardHref = current ? dashboardPathFor(current.profile.role) : null;

  return (
    <header className={styles.header}>
      <nav className={`container ${styles.nav}`} aria-label="Main">
        <Link href="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">UA</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>UA Scholar</span>
            <span className={styles.brandTag}>University of the Assumption</span>
          </span>
        </Link>

        <NavMenu signedIn={Boolean(current)} dashboardHref={dashboardHref} />
      </nav>
    </header>
  );
}
