import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptAdminData } from '@/app/_lib/aes-encryption';
import { ROLE_LABELS } from '@/lib/constants';
import PageHeader from '@/components/PageHeader/PageHeader';
import AdminProfileForm from '@/components/AdminProfileForm/AdminProfileForm';
import styles from './page.module.css';

export const metadata = { title: 'My Account | UA Scholar Admin' };

export default async function AdminProfilePage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [{ data: row }, { data: assignments }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, admin_data_encrypted').eq('id', profile.id).single(),
    supabase.from('admin_assignments').select('scholarship:scholarships(name)').eq('admin_id', profile.id),
  ]);

  const details = decryptAdminData(row.admin_data_encrypted, profile.id, {});

  return (
    <>
      <PageHeader title="My Account" description={ROLE_LABELS[profile.role]} />

      <div className={styles.columns}>
        <section className={styles.card}>
          <p className={styles.secure}>🔒 Your account details are encrypted (AES-256) with the administrator key.</p>
          <AdminProfileForm email={row.email} fullName={row.full_name} details={details} />
        </section>

        <section className={styles.card}>
          <h2>Assigned scholarships</h2>
          {assignments?.length ? (
            <ul className={styles.list}>
              {assignments.map((item) => <li key={item.scholarship?.name}>{item.scholarship?.name}</li>)}
            </ul>
          ) : (
            <p className={styles.muted}>
              {profile.role === 'super_admin' ? 'Super admins can access all scholarships.' : 'No scholarships assigned yet. Contact a super admin.'}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
