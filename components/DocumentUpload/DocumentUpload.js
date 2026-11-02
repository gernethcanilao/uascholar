'use client';

import { useActionState } from 'react';
import { uploadAdditionalDocument } from '@/app/student/applications/[id]/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './DocumentUpload.module.css';

export default function DocumentUpload({ applicationId }) {
  const [state, formAction] = useActionState(uploadAdditionalDocument, null);

  return (
    <form action={formAction} className={styles.form}>
      <h3 className={styles.title}>Upload another document</h3>
      <FormMessage state={state} />
      <input type="hidden" name="applicationId" value={applicationId} />

      <div className={styles.row}>
        <div>
          <label htmlFor="documentType">Document name</label>
          <input id="documentType" name="documentType" placeholder="e.g. Certificate of enrollment" required maxLength={100} />
        </div>
        <div>
          <label htmlFor="file">File (PDF, PNG, JPG · max 5 MB)</label>
          <input id="file" name="file" type="file" accept="application/pdf,image/png,image/jpeg" required />
        </div>
      </div>

      <SubmitButton variant="outline" pendingText="Uploading...">Upload document</SubmitButton>
    </form>
  );
}
