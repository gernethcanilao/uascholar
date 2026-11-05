import Link from 'next/link';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import styles from './Navbar.module.css';

export default async function Navbar() {
  const current = await getCurrentUser();

  return (
    <header className={styles.header}>
      <nav className={`container ${styles.nav}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>UA</span> Scholar
        </Link>

        <div className={styles.links}>
          <Link href="/">Home</Link>

          {current ? (
            <>
              <Link href="/scholarships">Scholarships</Link>
              <Link href={dashboardPathFor(current.profile.role)}>Dashboard</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className={styles.signOut}>Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login">Log in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
