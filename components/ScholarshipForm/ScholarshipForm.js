'use client';

import { useActionState } from 'react';
import { SCHOLARSHIP_CATEGORIES } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ScholarshipForm.module.css';

const toLines = (items) => (items ?? []).join('\n');

/** Used for both "Add" and "Edit". `action` is a Server Action passed from the page. */
export default function ScholarshipForm({ action, scholarship, submitLabel }) {
  const [state, formAction] = useActionState(action, null);

  // After an error, show what the admin typed; otherwise show the saved scholarship.
  const values = state?.values ?? {
    name: scholarship?.name ?? '',
    category: scholarship?.category ?? '',
    summary: scholarship?.summary ?? '',
    benefits: toLines(scholarship?.benefits),
    eligibility: toLines(scholarship?.eligibility),
    applicationProcess: toLines(scholarship?.application_process),
    requiredDocuments: toLines(scholarship?.required_documents),
    deadline: scholarship?.deadline ?? '',
    isActive: scholarship ? (scholarship.is_active ? 'on' : '') : 'on',
  };

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      {scholarship && <input type="hidden" name="id" value={scholarship.id} />}

      <div className={styles.grid}>
        <div className={styles.wide}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required maxLength={150} defaultValue={values.name} />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <select id="category" name="category" required defaultValue={values.category}>
            <option value="" disabled>Select category</option>
            {SCHOLARSHIP_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="summary">Short summary</label>
        <textarea id="summary" name="summary" rows={2} required maxLength={500} defaultValue={values.summary} />
      </div>

      <p className={styles.hint}>For the lists below, write one item per line.</p>

      <div className={styles.grid}>
        <div>
          <label htmlFor="benefits">Benefits</label>
          <textarea id="benefits" name="benefits" rows={5} defaultValue={values.benefits} />
        </div>
        <div>
          <label htmlFor="eligibility">Eligibility requirements</label>
          <textarea id="eligibility" name="eligibility" rows={5} defaultValue={values.eligibility} />
        </div>
        <div>
          <label htmlFor="applicationProcess">Application process (steps)</label>
          <textarea id="applicationProcess" name="applicationProcess" rows={5} defaultValue={values.applicationProcess} />
        </div>
        <div>
          <label htmlFor="requiredDocuments">Required documents (max 10)</label>
          <textarea id="requiredDocuments" name="requiredDocuments" rows={5} defaultValue={values.requiredDocuments} />
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <label htmlFor="deadline">Application deadline (optional)</label>
          <input id="deadline" name="deadline" type="date" defaultValue={values.deadline} />
        </div>
        <label className={styles.checkbox}>
          <input type="checkbox" name="isActive" defaultChecked={values.isActive === 'on'} />
          <span>Active (visible to students and open for applications)</span>
        </label>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingText="Saving...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
