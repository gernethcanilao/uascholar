'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

/** Navigation links with active state and a collapsible menu on small screens. */
export default function NavMenu({ signedIn, dashboardHref }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const linkClass = (href) => `${styles.link} ${isActive(href) ? styles.linkActive : ''}`;

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="main-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`${styles.toggleBar} ${open ? styles.toggleOpen : ''}`} />
      </button>

      <div id="main-menu" className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.links}>
          <Link href="/" className={linkClass('/')}>Home</Link>
          {signedIn && (
            <>
              <Link href="/scholarships" className={linkClass('/scholarships')}>Scholarships</Link>
              <Link href={dashboardHref} className={linkClass(dashboardHref.replace(/\/dashboard$/, ''))}>
                Dashboard
              </Link>
            </>
          )}
        </div>

        <div className={styles.actions}>
          {signedIn ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.signOut}>Sign out</button>
            </form>
          ) : (
            <>
              <Link href="/login" className={styles.login}>Log in</Link>
              <Link href="/register" className={styles.register}>Register</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
