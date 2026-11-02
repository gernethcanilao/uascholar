'use client';

import { useActionState } from 'react';
import { reviewApplication } from '@/app/admin/applications/[id]/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ReviewForm.module.css';

export default function ReviewForm({ applicationId, currentNotes = '' }) {
  const [state, formAction] = useActionState(reviewApplication, null);

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label htmlFor="notes">Review notes (internal, encrypted)</label>
        <textarea id="notes" name="notes" rows={6} maxLength={2000} defaultValue={currentNotes} />
      </div>

      <div className={styles.buttons}>
        <SubmitButton name="decision" value="approved" variant="success" pendingText="Saving...">Approve</SubmitButton>
        <SubmitButton name="decision" value="rejected" variant="danger" pendingText="Saving...">Reject</SubmitButton>
      </div>
    </form>
  );
}
