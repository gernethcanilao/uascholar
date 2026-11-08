'use client';

import { useActionState } from 'react';
import { createAnnouncement } from '@/app/admin/announcements/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './AnnouncementForm.module.css';

/**
 * scholarships: [{ id, name }] the admin is assigned to. The announcement is shown to students as
 * "<scholarship name> Admin"; super admins post as "General Admin". (The database sets the label.)
 */
export default function AnnouncementForm({ isSuperAdmin = false, scholarships = [] }) {
  const [state, formAction] = useActionState(createAnnouncement, null);
  const values = state?.values ?? {};

  if (!isSuperAdmin && scholarships.length === 0) {
    return (
      <p className={styles.note}>
        You are not assigned to a scholarship yet, so you cannot post announcements. Ask a super admin to assign one.
      </p>
    );
  }

  const single = !isSuperAdmin && scholarships.length === 1 ? scholarships[0] : null;

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      {isSuperAdmin && <p className={styles.source}>Posting as <strong>General Admin</strong></p>}

      {single && (
        <>
          <input type="hidden" name="scholarshipId" value={single.id} />
          <p className={styles.source}>Posting as <strong>{single.name} Admin</strong></p>
        </>
      )}

      {!isSuperAdmin && !single && (
        <div>
          <label htmlFor="scholarshipId">Post for</label>
          <select id="scholarshipId" name="scholarshipId" required defaultValue={values.scholarshipId ?? ''}>
            <option value="" disabled>Select a scholarship</option>
            {scholarships.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p className={styles.hint}>Students will see it as &ldquo;&lt;scholarship&gt; Admin&rdquo;.</p>
        </div>
      )}

      <div>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required maxLength={150} defaultValue={values.title} />
      </div>

      <div>
        <label htmlFor="body">Message</label>
        <textarea id="body" name="body" rows={6} required maxLength={3000} defaultValue={values.body} />
      </div>

      <SubmitButton pendingText="Publishing...">Publish announcement</SubmitButton>
    </form>
  );
}
