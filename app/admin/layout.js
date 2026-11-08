import { requireAdmin } from '@/lib/auth';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import Sidebar from '@/components/Sidebar/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentProfile } from '@/lib/profile';
import { getInitials, composeFullName } from '@/lib/names';
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

  // Initials from the first and last name (never the suffix). Admins who registered as students have
  // them saved separately; they are used only while they still match the current full name.
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('profiles')
    .select('id, personal_data_encrypted')
    .eq('id', profile.id)
    .single();
  const { personal } = decryptStudentProfile(row);
  const namesMatch = personal.firstName
    && composeFullName(personal.firstName, personal.lastName, personal.suffix) === profile.full_name;
  const initials = getInitials({
    ...(namesMatch ? { firstName: personal.firstName, lastName: personal.lastName } : {}),
    fullName: profile.full_name,
    fallback: profile.email,
  });
  const links = profile.role === ROLES.SUPER_ADMIN ? [...ADMIN_LINKS, ...SUPER_ADMIN_LINKS] : ADMIN_LINKS;

  return (
    <div className={`container ${styles.layout}`}>
      <Sidebar title={profile.full_name || 'Administrator'} subtitle={ROLE_LABELS[profile.role]} links={links} initials={initials} role={profile.role} />
      <section className={styles.content}>{children}</section>
    </div>
  );
}
