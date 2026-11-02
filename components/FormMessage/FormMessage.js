import styles from './FormMessage.module.css';

/** Shows the { error } or { success } message returned by a Server Action. */
export default function FormMessage({ state }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className={styles.error}>{state.error}</p>;
  if (state.success) return <p role="status" className={styles.success}>{state.success}</p>;
  return null;
}
