'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { registerAction } from '@/app/register/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import PasswordInput from '@/components/PasswordInput/PasswordInput';
import { FieldLabel, FieldError, RequiredLegend, errorProps } from '@/components/FormField/FormField';
import { formatPersonName, normalizeSuffix, SUFFIX_EXAMPLES } from '@/lib/names';
import styles from './RegisterForm.module.css';

const REQUIRED = {
  firstName: 'First name is required.',
  lastName: 'Last name is required.',
  email: 'Email is required.',
  password: 'Password is required.',
  confirmPassword: 'Please confirm your password.',
};

/** Quick checks in the browser; the server repeats all of them (they cannot be bypassed). */
function validate(data) {
  const errors = {};
  for (const [field, message] of Object.entries(REQUIRED)) {
    if (!String(data.get(field) ?? '').trim()) errors[field] = message;
  }
  if (normalizeSuffix(data.get('suffix')) === null) {
    errors.suffix = `Use a suffix such as ${SUFFIX_EXAMPLES}, or leave it blank.`;
  }
  const password = String(data.get('password') ?? '');
  if (!errors.confirmPassword && password && password !== data.get('confirmPassword')) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, null);
  const [submitting, startSubmitting] = useTransition();
  const [errors, setErrors] = useState({});

  // Show the server's field messages after each response.
  useEffect(() => setErrors(state?.fieldErrors ?? {}), [state]);

  if (state?.success) return <FormMessage state={state} />;

  const v = state?.values ?? {};

  function handleSubmit(event) {
    // Submitting manually also stops React from clearing the form after an error.
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      form.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    startSubmitting(() => formAction(data));
  }

  // Remove a field's message as soon as the user edits it.
  function clearError(event) {
    const { name } = event.target;
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  }

  // Proper name case when leaving the field: "mARY aVELAINE" -> "Mary Avelaine".
  function formatName(event) {
    event.target.value = formatPersonName(event.target.value);
  }

  function formatSuffix(event) {
    const suffix = normalizeSuffix(event.target.value);
    if (suffix !== null) event.target.value = suffix;
  }

  const showTopMessage = state?.error && !state?.fieldErrors;

  return (
    <form action={formAction} onSubmit={handleSubmit} onChange={clearError} className={styles.form} noValidate>
      {showTopMessage && <FormMessage state={state} />}
      <RequiredLegend />

      <div className={styles.row}>
        <div>
          <FieldLabel htmlFor="firstName" required>First Name</FieldLabel>
          <input id="firstName" name="firstName" defaultValue={v.firstName} onBlur={formatName} autoComplete="given-name" placeholder="Enter your first name" required maxLength={75} {...errorProps('firstName', errors)} />
          <FieldError id="firstName-error" message={errors.firstName} />
        </div>
        <div>
          <FieldLabel htmlFor="lastName" required>Last Name</FieldLabel>
          <input id="lastName" name="lastName" defaultValue={v.lastName} onBlur={formatName} autoComplete="family-name" placeholder="Enter your last name" required maxLength={75} {...errorProps('lastName', errors)} />
          <FieldError id="lastName-error" message={errors.lastName} />
        </div>
      </div>

      <div className={styles.suffix}>
        <FieldLabel htmlFor="suffix">Suffix</FieldLabel>
        <input id="suffix" name="suffix" defaultValue={v.suffix} onBlur={formatSuffix} autoComplete="honorific-suffix" placeholder="e.g. Jr., III" maxLength={10} {...errorProps('suffix', errors)} />
        <FieldError id="suffix-error" message={errors.suffix} />
      </div>

      <div>
        <FieldLabel htmlFor="email" required>Email</FieldLabel>
        <input id="email" name="email" type="email" defaultValue={v.email} autoComplete="email" required maxLength={254} {...errorProps('email', errors)} />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className={styles.row}>
        <div>
          <FieldLabel htmlFor="password" required>Password</FieldLabel>
          <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} maxLength={72} {...errorProps('password', errors)} />
          <FieldError id="password-error" message={errors.password} />
        </div>
        <div>
          <FieldLabel htmlFor="confirmPassword" required>Confirm password</FieldLabel>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required minLength={8} maxLength={72} {...errorProps('confirmPassword', errors)} />
          <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
        </div>
      </div>
      <p className={styles.hint}>At least 8 characters with a letter and a number.</p>

      <SubmitButton pendingText="Creating account..." pending={submitting}>Create account</SubmitButton>
    </form>
  );
}
