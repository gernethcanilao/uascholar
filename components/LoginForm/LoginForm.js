'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/login/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './LoginForm.module.css';

export default function LoginForm({ next }) {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <SubmitButton pendingText="Logging in...">Log in</SubmitButton>
    </form>
  );
}
