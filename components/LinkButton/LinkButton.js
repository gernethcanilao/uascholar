import Link from 'next/link';
import styles from './LinkButton.module.css';

/** A link that looks like a button. variant: primary | secondary | outline */
export default function LinkButton({ href, children, variant = 'primary' }) {
  return (
    <Link href={href} className={`${styles.button} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
