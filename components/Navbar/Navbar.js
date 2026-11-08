import Link from 'next/link';
import Image from 'next/image';
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
          <Image src="/ua-logo.png" alt="" width={44} height={44} className={styles.logo} priority />
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
