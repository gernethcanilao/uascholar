'use client';

import { useActionState, useState } from 'react';
import { loginAction } from '@/app/login/actions';
import { UA_EMAIL_DOMAIN } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './LoginForm.module.css';

export default function LoginForm({ next }) {
  const [state, formAction] = useActionState(loginAction, null);
  const [email, setEmail] = useState('');

  // Show the UA domain as a faded suffix until the user types "@" themselves.
  const showDomainHint = email.length > 0 && !email.includes('@');

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email">UA Email</label>
        <div className={styles.emailField}>
          <input
            id="email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={`yourname@${UA_EMAIL_DOMAIN}`}
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {showDomainHint && (
            <span className={styles.domainHint} aria-hidden="true">
              <span className={styles.typed}>{email}</span>@{UA_EMAIL_DOMAIN}
            </span>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <SubmitButton pendingText="Logging in...">Log in</SubmitButton>
    </form>
  );
}
