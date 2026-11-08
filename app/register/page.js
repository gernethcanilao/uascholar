import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import styles from './page.module.css';

export const metadata = { title: 'Register | UA Scholar' };

export default async function RegisterPage() {
  const current = await getCurrentUser();
  if (current) redirect(dashboardPathFor(current.profile.role));

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image src="/ua-logo.png" alt="University of the Assumption seal" width={72} height={72} className={styles.logo} priority />
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Register as a UA student to apply for scholarships.</p>

        <RegisterForm />

        <p className={styles.footer}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
