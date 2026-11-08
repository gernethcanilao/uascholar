import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandCol}>
          <div className={styles.brand}>
            <Image src="/ua-logo.png" alt="" width={40} height={40} className={styles.logo} />
            <span>UA Scholar</span>
          </div>
          <p className={styles.tagline}>
            The official scholarship and grants portal of the University of the Assumption.
          </p>
        </div>

        <div className={styles.col}>
          <h2 className={styles.heading}>Visit us</h2>
          <span>University of the Assumption</span>
          <span>City of San Fernando, Pampanga</span>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} University of the Assumption. All rights reserved.</span>
      </div>
    </footer>
  );
}
