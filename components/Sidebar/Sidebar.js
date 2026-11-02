'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

/** Side navigation for the student and admin areas. links: [{ href, label }] */
export default function Sidebar({ title, subtitle, links }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <strong>{title}</strong>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} className={isActive ? styles.active : styles.link}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
