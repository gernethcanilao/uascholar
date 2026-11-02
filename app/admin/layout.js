import { requireAdmin } from '@/lib/auth';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './layout.module.css';

const ADMIN_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/students', label: 'Student Directory' },
  { href: '/admin/scholarships', label: 'Scholarships' },
  { href: '/admin/announcements', label: 'Announcements' },
  { href: '/admin/profile', label: 'My Account' },
];

const SUPER_ADMIN_LINKS = [{ href: '/admin/accounts', label: 'Account Management' }];

export default async function AdminLayout({ children }) {
  const { profile } = await requireAdmin();
  const links = profile.role === ROLES.SUPER_ADMIN ? [...ADMIN_LINKS, ...SUPER_ADMIN_LINKS] : ADMIN_LINKS;

  return (
    <div className={`container ${styles.layout}`}>
      <Sidebar title={profile.full_name || 'Administrator'} subtitle={ROLE_LABELS[profile.role]} links={links} />
      <section className={styles.content}>{children}</section>
    </div>
  );
}
