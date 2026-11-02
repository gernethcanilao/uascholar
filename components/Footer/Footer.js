import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p>© {new Date().getFullYear()} University of the Assumption · UA Scholar</p>
        <p className={styles.note}>City of San Fernando, Pampanga</p>
      </div>
    </footer>
  );
}
