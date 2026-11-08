import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentProfile, resolveNames } from '@/lib/profile';
import { getInitials } from '@/lib/names';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './layout.module.css';

const STUDENT_LINKS = [
  { href: '/student/dashboard', label: 'Dashboard' },
  { href: '/student/profile', label: 'My Profile' },
  { href: '/scholarships', label: 'Browse Scholarships' },
  { href: '/student/applications', label: 'My Applications' },
  { href: '/student/notifications', label: 'Notifications' },
];

export default async function StudentLayout({ children }) {
  const { user, profile } = await requireStudent();

  // Initials come from the first and last name (never the suffix).
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('profiles')
    .select('id, personal_data_encrypted')
    .eq('id', profile.id)
    .single();
  const { firstName, lastName } = resolveNames(decryptStudentProfile(row).personal, user, profile.full_name);
  const initials = getInitials({ firstName, lastName, fullName: profile.full_name, fallback: profile.email });

  return (
    <div className={`container ${styles.layout}`}>
      <Sidebar title={profile.full_name || 'Student'} subtitle={profile.email} links={STUDENT_LINKS} initials={initials} role={profile.role} />
      <section className={styles.content}>{children}</section>
    </div>
  );
}
