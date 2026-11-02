import Link from 'next/link';
import { formatDateTime } from '@/lib/format';
import { safeRedirectPath } from '@/lib/validation';
import styles from './NotificationList.module.css';

/** items: [{ id, title, body, link?, is_read, created_at }] */
export default function NotificationList({ items, emptyText = 'Nothing here yet.' }) {
  if (!items.length) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={`${styles.item} ${item.is_read ? '' : styles.unread}`}>
          <div className={styles.top}>
            <strong>{item.title}</strong>
            <time className={styles.time}>{formatDateTime(item.created_at)}</time>
          </div>
          <p className={styles.body}>{item.body}</p>
          {item.link && <Link href={safeRedirectPath(item.link, '/student/dashboard')}>View details →</Link>}
        </li>
      ))}
    </ul>
  );
}
