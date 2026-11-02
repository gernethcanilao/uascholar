'use client';

import { useActionState } from 'react';
import { submitApplication } from '@/app/student/scholarships/[id]/apply/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ApplicationForm.module.css';

const ACCEPTED_FILES = 'application/pdf,image/png,image/jpeg';

export default function ApplicationForm({ scholarshipId, requiredDocuments = [] }) {
  const [state, formAction] = useActionState(submitApplication, null);
  const values = state?.values ?? {};

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />
      <input type="hidden" name="scholarshipId" value={scholarshipId} />

      <section className={styles.section}>
        <h2>Application details</h2>

        <div>
          <label htmlFor="reason">Why are you applying for this scholarship?</label>
          <textarea id="reason" name="reason" rows={5} required maxLength={2000} defaultValue={values.reason} />
        </div>

        <div className={styles.grid}>
          <div>
            <label htmlFor="monthlyFamilyIncome">Monthly family income (₱)</label>
            <input id="monthlyFamilyIncome" name="monthlyFamilyIncome" type="number" min="0" step="1" required defaultValue={values.monthlyFamilyIncome} />
          </div>
          <div>
            <label htmlFor="numberOfSiblings">Number of siblings</label>
            <input id="numberOfSiblings" name="numberOfSiblings" type="number" min="0" max="30" defaultValue={values.numberOfSiblings} />
          </div>
        </div>

        <div>
          <label htmlFor="achievements">Achievements, awards or memberships (optional)</label>
          <textarea id="achievements" name="achievements" rows={3} maxLength={1500} defaultValue={values.achievements} />
        </div>
      </section>

      {requiredDocuments.length > 0 && (
        <section className={styles.section}>
          <h2>Supporting documents</h2>
          <p className={styles.hint}>PDF, PNG or JPG only, up to 5 MB each. Files are encrypted before storage.</p>
          {requiredDocuments.map((documentName, index) => (
            <div key={documentName} className={styles.fileRow}>
              <label htmlFor={`document_${index}`}>{documentName}</label>
              <input id={`document_${index}`} name={`document_${index}`} type="file" accept={ACCEPTED_FILES} required />
            </div>
          ))}
        </section>
      )}

      <label className={styles.confirm}>
        <input type="checkbox" name="confirmEligibility" required />
        <span>I confirm that I meet the eligibility requirements and that all information I provided is true and correct.</span>
      </label>

      <div className={styles.actions}>
        <SubmitButton pendingText="Submitting...">Submit application</SubmitButton>
      </div>
    </form>
  );
}
