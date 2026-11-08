import { ROLES } from '@/lib/constants';
import styles from './Avatar.module.css';

/**
 * Initials avatar. The color only shows the account type (visual cue, not access control):
 * students are blue, scholarship admins and super admins are yellow.
 * `role` must come from the signed-in user's profile on the server.
 */
export default function Avatar({ initials, role, className = '' }) {
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
  return (
    <span className={`${styles.avatar} ${isAdmin ? styles.admin : styles.student} ${className}`} aria-hidden="true">
      {initials || '?'}
    </span>
  );
}
