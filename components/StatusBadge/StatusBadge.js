import { capitalize } from '@/lib/format';
import styles from './StatusBadge.module.css';

/** Coloured label for pending / approved / rejected (or active / inactive). */
export default function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles[status] ?? ''}`}>{capitalize(status)}</span>;
}
