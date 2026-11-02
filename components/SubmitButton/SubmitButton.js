'use client';

import { useFormStatus } from 'react-dom';
import styles from './SubmitButton.module.css';

/** Submit button that disables itself while the form is being sent. variant: primary | danger | success | outline */
export default function SubmitButton({ children, pendingText = 'Please wait...', variant = 'primary', name, value }) {
  const { pending } = useFormStatus();

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
