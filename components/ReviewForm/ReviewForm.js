'use client';

import { useActionState, useState, useTransition } from 'react';
import { reviewApplication } from '@/app/admin/applications/[id]/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ReviewForm.module.css';

export default function ReviewForm({ applicationId, currentNotes = '' }) {
  const [state, formAction] = useActionState(reviewApplication, null);
  const [saving, startSaving] = useTransition();
  // Which button was clicked ('approved' or 'rejected'), so only that one shows the spinner.
  const [decision, setDecision] = useState(null);

  // Submitted manually so React does not reset the form: the review notes stay if saving fails.
  function handleSubmit(event) {
    event.preventDefault();
    if (saving) return; // no duplicate or conflicting decisions while one is being saved
    const data = new FormData(event.currentTarget, event.nativeEvent.submitter);
    setDecision(data.get('decision'));
    startSaving(() => formAction(data));
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label htmlFor="notes">Review notes (internal, encrypted)</label>
        <textarea id="notes" name="notes" rows={6} maxLength={2000} defaultValue={currentNotes} />
      </div>

      <div className={styles.buttons}>
        <SubmitButton name="decision" value="approved" variant="success" pending={saving} loading={saving && decision === 'approved'}>
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="rejected" variant="danger" pending={saving} loading={saving && decision === 'rejected'}>
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}
