'use client';

import { useActionState } from 'react';
import { updateStudentProfile } from '@/app/student/profile/actions';
import { YEAR_LEVELS, COURSE_GROUPS, COURSES } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ProfileForm.module.css';

export default function ProfileForm({ email, fullName, personal, academic }) {
  const [state, formAction] = useActionState(updateStudentProfile, null);
  // After an error, refill the form with what the student typed (React resets forms after an action).
  const v = state?.values ?? {
    fullName,
    ...personal,
    ...academic,
    // A course typed before the dropdown existed must be chosen again from the list.
    course: COURSES.includes(academic.course) ? academic.course : '',
  };

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      <fieldset className={styles.fieldset}>
        <legend>Personal information</legend>
        <div className={styles.grid}>
          <div>
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" defaultValue={v.fullName} required maxLength={150} />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} disabled readOnly />
          </div>
          <div>
            <label htmlFor="studentNumber">Student number</label>
            <input id="studentNumber" name="studentNumber" defaultValue={v.studentNumber} required maxLength={30} />
          </div>
          <div>
            <label htmlFor="phone">Contact number</label>
            <input id="phone" name="phone" type="tel" defaultValue={v.phone} required maxLength={20} />
          </div>
          <div>
            <label htmlFor="birthdate">Birthdate</label>
            <input id="birthdate" name="birthdate" type="date" defaultValue={v.birthdate} />
          </div>
          <div className={styles.full}>
            <label htmlFor="address">Home address</label>
            <input id="address" name="address" defaultValue={v.address} maxLength={300} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Academic information</legend>
        <div className={styles.grid}>
          <div>
            <label htmlFor="course">Course / Program</label>
            <select id="course" name="course" defaultValue={v.course} required>
              <option value="" disabled>Select course</option>
              {COURSE_GROUPS.map((group) => (
                <optgroup key={group.college} label={group.college}>
                  {group.courses.map((course) => <option key={course} value={course}>{course}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="yearLevel">Year level</label>
            <select id="yearLevel" name="yearLevel" defaultValue={v.yearLevel} required>
              <option value="" disabled>Select year level</option>
              {YEAR_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <SubmitButton pendingText="Saving...">Save profile</SubmitButton>
      </div>
    </form>
  );
}
