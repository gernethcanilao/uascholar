'use client';

import styles from './error.module.css';

/** Generic error page. Never shows internal error details to the user. */
export default function ErrorPage({ reset }) {
  return (
    <div className={styles.wrapper}>
      <h1>Something went wrong</h1>
      <p>Please try again. If the problem continues, contact the Scholarship Office.</p>
      <button type="button" className={styles.button} onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
