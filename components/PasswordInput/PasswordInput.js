'use client';

import { useState } from 'react';
import styles from './PasswordInput.module.css';

/**
 * Password field with an eye button to show or hide what is typed.
 * Hidden by default; all other props (id, name, required, minLength, ...) go to the <input>.
 */
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <input {...props} type={visible ? 'text' : 'password'} className={styles.input} />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          // Eye-off: password is visible, click to hide
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
            <path d="M9.9 5.2A9.8 9.8 0 0112 5c5 0 8.5 4.3 9.5 7a11.8 11.8 0 01-3.1 4.4M6.6 6.6A11.6 11.6 0 002.5 12c1 2.7 4.5 7 9.5 7a9.7 9.7 0 004.2-.9" />
          </svg>
        ) : (
          // Eye: password is hidden, click to show
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 12c1-2.7 4.5-7 9.5-7s8.5 4.3 9.5 7c-1 2.7-4.5 7-9.5 7s-8.5-4.3-9.5-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
