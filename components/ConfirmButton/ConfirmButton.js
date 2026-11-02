'use client';

import { useFormStatus } from 'react-dom';
import styles from './ConfirmButton.module.css';

/** Submit button that asks for confirmation first (used for destructive actions). */
export default function ConfirmButton({ children, message = 'Are you sure?' }) {
  const { pending } = useFormStatus();

  function handleClick(event) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <button type="submit" className={styles.button} onClick={handleClick} disabled={pending}>
      {pending ? 'Working...' : children}
    </button>
  );
}
