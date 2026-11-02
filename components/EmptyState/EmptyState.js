import styles from './EmptyState.module.css';

export default function EmptyState({ title, message, children }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {children}
    </div>
  );
}
