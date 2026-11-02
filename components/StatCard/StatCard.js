import styles from './StatCard.module.css';

/** Summary number tile for dashboards. tone: default | pending | approved | rejected */
export default function StatCard({ label, value, tone = 'default' }) {
  return (
    <div className={`${styles.card} ${styles[tone]}`}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
    </div>
  );
}
