import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { sanitizeSearch } from '@/lib/validation';
import ScholarshipCard from '@/components/ScholarshipCard/ScholarshipCard';
import SearchFilter from '@/components/SearchFilter/SearchFilter';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Scholarships | UA Scholar' };

export default async function ScholarshipsPage({ searchParams }) {
  // Scholarship listings are only for logged-in users.
  await requireUser();

  const params = await searchParams;
  const query = sanitizeSearch(params.q);

  const supabase = await createClient();
  let request = supabase
    .from('scholarships')
    .select('id, slug, name, category, summary')
    .eq('is_active', true)
    .order('name');

  if (query) request = request.or(`name.ilike.%${query}%,summary.ilike.%${query}%`);

  const { data: scholarships } = await request;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Find a Scholarship</h1>
      <p className={styles.subtitle}>Search by scholarship name or keyword.</p>

      <SearchFilter query={query} />

      <p className={styles.count}>
        {scholarships?.length ?? 0} result{scholarships?.length === 1 ? '' : 's'}
        {query && <> for &ldquo;{query}&rdquo;</>}
      </p>

      {scholarships?.length ? (
        <div className={styles.grid}>
          {scholarships.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
      ) : (
        <EmptyState title="No matching scholarships" message="Try a different keyword." />
      )}
    </div>
  );
}
