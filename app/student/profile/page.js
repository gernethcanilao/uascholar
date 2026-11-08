import { requireStudent } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentProfile, resolveNames } from '@/lib/profile';
import PageHeader from '@/components/PageHeader/PageHeader';
import ProfileForm from '@/components/ProfileForm/ProfileForm';
import styles from './page.module.css';

export const metadata = { title: 'My Profile | UA Scholar' };

export default async function StudentProfilePage() {
  const { user, profile } = await requireStudent();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('profiles')
    .select('id, full_name, email, personal_data_encrypted, academic_data_encrypted')
    .eq('id', profile.id)
    .single();

  const { personal, academic } = decryptStudentProfile(row);
  const { firstName, lastName, suffix } = resolveNames(personal, user, row.full_name);

  return (
    <>
      <PageHeader title="My Profile" description="Keep your personal and academic information up to date." />
      <div className={styles.card}>
        <ProfileForm
          email={row.email}
          firstName={firstName}
          lastName={lastName}
          suffix={suffix}
          personal={personal}
          academic={academic}
        />
      </div>
    </>
  );
}
