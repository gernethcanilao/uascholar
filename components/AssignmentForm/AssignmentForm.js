'use client';

import { useActionState } from 'react';
import { assignScholarship } from '@/app/admin/accounts/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './AssignmentForm.module.css';

export default function AssignmentForm({ admins, scholarships }) {
  const [state, formAction] = useActionState(assignScholarship, null);

  if (!admins.length) {
    return <p className={styles.note}>There are no Scholarship Admin accounts yet. Change a user&apos;s role above first.</p>;
  }

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <div className={styles.row}>
        <select name="adminId" required defaultValue="" aria-label="Admin">
          <option value="" disabled>Select admin</option>
          {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.full_name || admin.email}</option>)}
        </select>
        <select name="scholarshipId" required defaultValue="" aria-label="Scholarship">
          <option value="" disabled>Select scholarship</option>
          {scholarships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <SubmitButton pendingText="Assigning...">Assign</SubmitButton>
      </div>
    </form>
  );
}
