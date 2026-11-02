import { requireStudent } from '@/lib/auth';
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
  const { profile } = await requireStudent();

  return (
    <div className={`container ${styles.layout}`}>
      <Sidebar title={profile.full_name || 'Student'} subtitle={profile.email} links={STUDENT_LINKS} />
      <section className={styles.content}>{children}</section>
    </div>
  );
}
