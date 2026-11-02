import { SCHOLARSHIP_CATEGORIES } from '@/lib/constants';
import styles from './SearchFilter.module.css';

/** Plain GET form: results are rendered by the server from the URL (?q=...&category=...). */
export default function SearchFilter({ query = '', category = '' }) {
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
      <select name="category" defaultValue={category} aria-label="Filter by category" className={styles.select}>
        <option value="">All categories</option>
        {SCHOLARSHIP_CATEGORIES.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <button type="submit" className={styles.button}>Search</button>
    </form>
  );
}
