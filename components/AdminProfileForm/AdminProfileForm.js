'use client';

import { useActionState } from 'react';
import { updateAdminProfile } from '@/app/admin/profile/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './AdminProfileForm.module.css';

export default function AdminProfileForm({ email, fullName, details }) {
  const [state, formAction] = useActionState(updateAdminProfile, null);

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      <div className={styles.grid}>
        <div>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required maxLength={150} defaultValue={fullName} />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" value={email} disabled readOnly />
        </div>
        <div>
          <label htmlFor="position">Position</label>
          <input id="position" name="position" maxLength={100} defaultValue={details.position ?? ''} />
        </div>
        <div>
          <label htmlFor="office">Office</label>
          <input id="office" name="office" maxLength={150} defaultValue={details.office ?? ''} />
        </div>
        <div>
          <label htmlFor="phone">Contact number</label>
          <input id="phone" name="phone" type="tel" maxLength={20} defaultValue={details.phone ?? ''} />
        </div>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingText="Saving...">Save details</SubmitButton>
      </div>
    </form>
  );
}
