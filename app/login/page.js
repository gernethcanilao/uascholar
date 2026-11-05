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
  const hasDomainError = params.error === 'domain';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>
          Log in with your UA email to apply for scholarships and track your applications.
          First time here? Enter your UA email to set up your account.
        </p>

        {hasAuthError && <p className={styles.error}>Sign in failed. Please try again.</p>}
        {hasDomainError && <p className={styles.error}>Please sign in with your UA email account (@ua.edu.ph).</p>}

        <LoginForm next={next} />
      </div>
    </div>
  );
}
