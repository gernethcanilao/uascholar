'use client';

import { useActionState } from 'react';
import { updateStudentProfile } from '@/app/student/profile/actions';
import { YEAR_LEVELS } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ProfileForm.module.css';

export default function ProfileForm({ email, fullName, personal, academic }) {
  const [state, formAction] = useActionState(updateStudentProfile, null);

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      <fieldset className={styles.fieldset}>
        <legend>Personal information</legend>
        <div className={styles.grid}>
          <div>
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" defaultValue={fullName} required maxLength={150} />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} disabled readOnly />
          </div>
          <div>
            <label htmlFor="studentNumber">Student number</label>
            <input id="studentNumber" name="studentNumber" defaultValue={personal.studentNumber} required maxLength={30} />
          </div>
          <div>
            <label htmlFor="phone">Contact number</label>
            <input id="phone" name="phone" type="tel" defaultValue={personal.phone} required maxLength={20} />
          </div>
          <div>
            <label htmlFor="birthdate">Birthdate</label>
            <input id="birthdate" name="birthdate" type="date" defaultValue={personal.birthdate} />
          </div>
          <div className={styles.full}>
            <label htmlFor="address">Home address</label>
            <input id="address" name="address" defaultValue={personal.address} maxLength={300} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Academic information</legend>
        <div className={styles.grid}>
          <div className={styles.full}>
            <label htmlFor="course">Course / Program</label>
            <input id="course" name="course" defaultValue={academic.course} required maxLength={150} />
          </div>
          <div>
            <label htmlFor="yearLevel">Year level</label>
            <select id="yearLevel" name="yearLevel" defaultValue={academic.yearLevel} required>
              <option value="" disabled>Select year level</option>
              {YEAR_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="gwa">General Weighted Average (GWA)</label>
            <input id="gwa" name="gwa" type="number" step="0.01" min="1" max="100" defaultValue={academic.gwa ?? ''} />
          </div>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <SubmitButton pendingText="Saving...">Save profile</SubmitButton>
      </div>
    </form>
  );
}
