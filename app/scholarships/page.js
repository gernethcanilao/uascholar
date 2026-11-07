import { createClient } from '@/lib/supabase/server';
import { sanitizeSearch } from '@/lib/validation';
import { SCHOLARSHIP_CATEGORIES } from '@/lib/constants';
import ScholarshipCard from '@/components/ScholarshipCard/ScholarshipCard';
import SearchFilter from '@/components/SearchFilter/SearchFilter';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Scholarships | UA Scholar' };

export default async function ScholarshipsPage({ searchParams }) {
  const params = await searchParams;
  const query = sanitizeSearch(params.q);
  const category = SCHOLARSHIP_CATEGORIES.includes(params.category) ? params.category : '';

  const supabase = await createClient();
  let request = supabase
    .from('scholarships')
    .select('id, slug, name, category, summary')
    .eq('is_active', true)
    .order('name');

  if (query) request = request.or(`name.ilike.%${query}%,summary.ilike.%${query}%`);
  if (category) request = request.eq('category', category);

  const { data: scholarships } = await request;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Find a Scholarship</h1>
      <p className={styles.subtitle}>Search by name or filter by category.</p>

      <SearchFilter query={query} category={category} />

      <p className={styles.count}>
        {scholarships?.length ?? 0} result{scholarships?.length === 1 ? '' : 's'}
        {query && <> for &ldquo;{query}&rdquo;</>}
        {category && <> in {category}</>}
      </p>

      {scholarships?.length ? (
        <div className={styles.grid}>
          {scholarships.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
      ) : (
        <EmptyState title="No matching scholarships" message="Try a different keyword or category." />
      )}
    </div>
  );
}
