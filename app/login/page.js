import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';
import { safeRedirectPath } from '@/lib/validation';
import LoginForm from '@/components/LoginForm/LoginForm';
import styles from './page.module.css';

export const metadata = { title: 'Log in | UA Scholar' };

export default async function LoginPage({ searchParams }) {
  const current = await getCurrentUser();
  if (current) redirect(dashboardPathFor(current.profile.role));

  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const hasAuthError = params.error === 'auth';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Image src="/ua-logo.png" alt="University of the Assumption seal" width={72} height={72} className={styles.logo} priority />
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Log in to apply for scholarships and track your applications.</p>

        {hasAuthError && <p className={styles.error}>Sign in failed. Please try again.</p>}

        <LoginForm next={next} />

        <p className={styles.footer}>
          No account yet? <Link href="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
