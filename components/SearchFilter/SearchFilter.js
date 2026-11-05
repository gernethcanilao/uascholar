import styles from './SearchFilter.module.css';

/** Plain GET form: results are rendered by the server from the URL (?q=...). */
export default function SearchFilter({ query = '' }) {
  return (
    <form action="/scholarships" method="get" className={styles.form} role="search">
      <input
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search scholarships..."
        maxLength={60}
        aria-label="Search scholarships"
        className={styles.input}
      />
      <button type="submit" className={styles.button}>Search</button>
    </form>
  );
}
