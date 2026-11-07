'use client';

import { useFormStatus } from 'react-dom';
import styles from './SubmitButton.module.css';

/**
 * Submit button that disables itself while the form is being sent. variant: primary | danger | success | outline
 * `pending` can be passed when the form is submitted manually (e.g. with startTransition).
 */
export default function SubmitButton({ children, pendingText = 'Please wait...', variant = 'primary', name, value, pending: pendingProp }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={`${styles.button} ${styles[variant]}`}
      disabled={pending}
    >
      {pending ? pendingText : children}
    </button>
  );
}
