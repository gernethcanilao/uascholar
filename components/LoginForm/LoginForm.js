'use client';

import { startTransition, useActionState, useState } from 'react';
import { loginAction } from '@/app/login/actions';
import { UA_EMAIL_DOMAIN } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './LoginForm.module.css';

/**
 * Login and first-time account setup in one form.
 * Steps: email -> password (existing account) or code -> setPassword (first-time setup).
 */
export default function LoginForm({ next }) {
  const [state, formAction] = useActionState(loginAction, null);
  const [email, setEmail] = useState('');

  const step = state?.step ?? 'email';
  const confirmedEmail = state?.email ?? email;

  // Show the UA domain as a faded suffix until the user types "@" themselves.
  const showDomainHint = email.length > 0 && !email.includes('@');

  // "Change" goes back to the email step. It is not a submit button, so pressing
  // Enter in the form still triggers the main action (Log in / Verify).
  function restart() {
    const formData = new FormData();
    formData.set('intent', 'restart');
    startTransition(() => formAction(formData));
  }

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="step" value={step} />

      {step === 'email' ? (
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
      ) : (
        <div>
          <input type="hidden" name="email" value={confirmedEmail} />
          <p className={styles.emailLabel}>UA Email</p>
          <div className={styles.emailRow}>
            <span className={styles.emailValue}>{confirmedEmail}</span>
            <button type="button" onClick={restart} className={styles.linkButton}>
              Change
            </button>
          </div>
        </div>
      )}

      {step === 'email' && <SubmitButton pendingText="Checking...">Continue</SubmitButton>}

      {step === 'password' && (
        <>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          </div>
          <SubmitButton pendingText="Logging in...">Log in</SubmitButton>
        </>
      )}

      {step === 'code' && (
        <>
          <div>
            <label htmlFor="code">Verification code</label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,12}"
              maxLength={12}
              required
              autoFocus
            />
          </div>
          <SubmitButton pendingText="Verifying...">Verify email</SubmitButton>
          <button type="submit" name="intent" value="resend" formNoValidate className={styles.linkButton}>
            Send a new code
          </button>
        </>
      )}

      {step === 'setPassword' && (
        <>
          <div>
            <label htmlFor="newPassword">Create a password</label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required autoFocus />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </div>
          <SubmitButton pendingText="Saving...">Create account</SubmitButton>
        </>
      )}
    </form>
  );
}
