import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ROLES } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { deleteScholarship } from './actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import LinkButton from '@/components/LinkButton/LinkButton';
import ConfirmButton from '@/components/ConfirmButton/ConfirmButton';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Scholarship Management | UA Scholar Admin' };

export default async function ScholarshipManagementPage() {
  const { profile } = await requireAdmin();
  const isSuperAdmin = profile.role === ROLES.SUPER_ADMIN;
  const supabase = await createClient();

  const [{ data: scholarships }, { data: assignments }] = await Promise.all([
    supabase.from('scholarships').select('id, name, category, deadline, is_active').order('name'),
    supabase.from('admin_assignments').select('scholarship_id').eq('admin_id', profile.id),
  ]);

  const assignedIds = new Set((assignments ?? []).map((item) => item.scholarship_id));
  const canEdit = (id) => isSuperAdmin || assignedIds.has(id);

  return (
    <>
      <PageHeader title="Scholarship Management" description="Add, edit or remove scholarship listings.">
        {isSuperAdmin && <LinkButton href="/admin/scholarships/new">+ Add scholarship</LinkButton>}
      </PageHeader>

      {scholarships?.length ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr><th>Name</th><th>Category</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {scholarships.map((scholarship) => (
                <tr key={scholarship.id}>
                  <td className={styles.name}>{scholarship.name}</td>
                  <td>{scholarship.category}</td>
                  <td>{formatDate(scholarship.deadline)}</td>
                  <td><StatusBadge status={scholarship.is_active ? 'active' : 'inactive'} /></td>
                  <td>
                    <div className={styles.actions}>
                      {canEdit(scholarship.id) && (
                        <Link href={`/admin/scholarships/${scholarship.id}/edit`}>Edit</Link>
                      )}
                      {isSuperAdmin && (
                        <form action={deleteScholarship}>
                          <input type="hidden" name="id" value={scholarship.id} />
                          <ConfirmButton message={`Remove "${scholarship.name}"? If it already has applications it will be deactivated instead.`}>
                            Remove
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No scholarships yet" />
      )}
    </>
  );
}
