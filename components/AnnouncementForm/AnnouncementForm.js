'use client';

import { useActionState } from 'react';
import { createAnnouncement } from '@/app/admin/announcements/actions';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './AnnouncementForm.module.css';

export default function AnnouncementForm() {
  const [state, formAction] = useActionState(createAnnouncement, null);
  const values = state?.values ?? {};

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

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
