import { requireSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { sanitizeAccountSearch } from '@/lib/validation';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import { removeAssignment } from './actions';
import PageHeader from '@/components/PageHeader/PageHeader';
import AccountRow from '@/components/AccountRow/AccountRow';
import AssignmentForm from '@/components/AssignmentForm/AssignmentForm';
import ConfirmButton from '@/components/ConfirmButton/ConfirmButton';
import EmptyState from '@/components/EmptyState/EmptyState';
import styles from './page.module.css';

export const metadata = { title: 'Account Management | UA Scholar Admin' };

export default async function AccountManagementPage({ searchParams }) {
  const { profile } = await requireSuperAdmin();
  const params = await searchParams;
  const query = sanitizeAccountSearch(params.q);
  const roleFilter = Object.values(ROLES).includes(params.role) ? params.role : '';

  const supabase = await createClient();

  let accountsRequest = supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  // Values are quoted so "." and "@" in an email are treated as text, not filter syntax.
  if (query) accountsRequest = accountsRequest.or(`full_name.ilike."%${query}%",email.ilike."%${query}%"`);
  if (roleFilter) accountsRequest = accountsRequest.eq('role', roleFilter);

  const [{ data: accounts }, { data: admins }, { data: scholarships }, { data: assignments }] = await Promise.all([
    accountsRequest,
    supabase.from('profiles').select('id, full_name, email').eq('role', ROLES.ADMIN).order('full_name'),
    supabase.from('scholarships').select('id, name').order('name'),
    supabase
      .from('admin_assignments')
      .select('admin_id, scholarship_id, admin:profiles(full_name, email), scholarship:scholarships(name)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <>
      <PageHeader title="Account Management" description="Manage user accounts, roles, access and scholarship assignments." />

      <section className={styles.card}>
        <h2>User accounts</h2>
        <form method="get" className={styles.filters} role="search">
          <input type="search" name="q" defaultValue={query} placeholder="Search name or email..." maxLength={100} aria-label="Search accounts" />
          <select name="role" defaultValue={roleFilter} aria-label="Filter by role">
            <option value="">All roles</option>
            {Object.values(ROLES).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </select>
          <button type="submit" className={styles.button}>Filter</button>
        </form>

        {accounts?.length ? (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr><th>User</th><th>Registered</th><th>Role</th><th>Access</th></tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <AccountRow key={account.id} account={account} isSelf={account.id === profile.id} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No accounts found" />
        )}
      </section>

      <section className={styles.card}>
        <h2>Scholarship assignments</h2>
        <p className={styles.muted}>Scholarship admins can only see applications and students of the scholarships assigned to them.</p>

        <AssignmentForm admins={admins ?? []} scholarships={scholarships ?? []} />

        {assignments?.length ? (
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr><th>Admin</th><th>Scholarship</th><th /></tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={`${item.admin_id}-${item.scholarship_id}`}>
                    <td>{item.admin?.full_name || item.admin?.email}</td>
                    <td>{item.scholarship?.name}</td>
                    <td>
                      <form action={removeAssignment}>
                        <input type="hidden" name="adminId" value={item.admin_id} />
                        <input type="hidden" name="scholarshipId" value={item.scholarship_id} />
                        <ConfirmButton message="Remove this assignment?">Remove</ConfirmButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No assignments yet" message="Promote a user to Scholarship Admin, then assign a scholarship." />
        )}
      </section>
    </>
  );
}
