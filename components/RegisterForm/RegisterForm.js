'use client';

import { useActionState } from 'react';
import { registerAction } from '@/app/register/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);

  if (state?.success) return <FormMessage state={state} />;

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      <div>
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" autoComplete="name" required maxLength={150} />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>

      <div className={styles.row}>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </div>
      </div>
      <p className={styles.hint}>At least 8 characters with a letter and a number.</p>

      <SubmitButton pendingText="Creating account...">Create account</SubmitButton>
    </form>
  );
}
