'use client';

import { useFormStatus } from 'react-dom';
import styles from './SubmitButton.module.css';

/**
 * Submit button that disables itself while the form is being sent. variant: primary | danger | success | outline
 * `pending` can be passed when the form is submitted manually (e.g. with startTransition).
 * `loading` switches to spinner mode: the label always stays, a spinner shows only while `loading` is true,
 * and while the form is busy the button stays disabled without fading (used for Approve / Reject).
 */
export default function SubmitButton({
  children, pendingText = 'Please wait...', variant = 'primary', name, value, pending: pendingProp, loading,
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  const spinnerMode = loading !== undefined;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={`${styles.button} ${styles[variant]} ${spinnerMode && pending ? styles.busy : ''}`}
      disabled={pending}
      aria-busy={spinnerMode ? Boolean(loading) : undefined}
    >
      {spinnerMode ? (
        <>
          {loading && <span className={styles.spinner} aria-hidden="true" />}
          {children}
        </>
      ) : (
        pending ? pendingText : children
      )}
    </button>
  );
}
