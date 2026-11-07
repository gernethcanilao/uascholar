'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Side navigation for the student and admin areas. links: [{ href, label }] */
export default function Sidebar({ title, subtitle, links }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">{initials(title)}</span>
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
