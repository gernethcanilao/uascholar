import styles from './PageHeader.module.css';

/** Title + description at the top of dashboard pages, with optional actions on the right. */
export default function PageHeader({ title, description, children }) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
