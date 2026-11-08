'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/Avatar/Avatar';
import styles from './Sidebar.module.css';

/**
 * Side navigation for the student and admin areas. links: [{ href, label }]
 * `initials` and `role` come from the signed-in user (see the student/admin layouts).
 */
export default function Sidebar({ title, subtitle, links, initials, role }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Avatar initials={initials} role={role} />
        <div className={styles.identity}>
          <strong className={styles.title}>{title}</strong>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      </div>
      <nav className={styles.nav} aria-label="Section">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
