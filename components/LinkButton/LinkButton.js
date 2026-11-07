import Link from 'next/link';
import styles from './LinkButton.module.css';

/** A link that looks like a button. variant: primary | secondary | outline | ghost. size: md | lg */
export default function LinkButton({ href, children, variant = 'primary', size = 'md' }) {
  return (
    <Link href={href} className={`${styles.button} ${styles[variant]} ${size === 'lg' ? styles.lg : ''}`}>
      {children}
    </Link>
  );
}
