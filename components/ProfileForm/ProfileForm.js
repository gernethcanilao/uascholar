'use client';

import { useActionState, useState } from 'react';
import { updateStudentProfile } from '@/app/student/profile/actions';
import { YEAR_LEVELS, UA_COLLEGES, coursesForCollege } from '@/lib/constants';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import styles from './ProfileForm.module.css';

export default function ProfileForm({ email, firstName, lastName, personal, academic }) {
  const [state, formAction] = useActionState(updateStudentProfile, null);

  // College and Course are linked: the Course list shows only the courses of the selected college.
  const [college, setCollege] = useState(UA_COLLEGES.includes(academic.college) ? academic.college : '');
  const courses = coursesForCollege(college);
  const [course, setCourse] = useState(
    courses.some((item) => item.name === academic.course) ? academic.course : ''
  );

  function handleCollegeChange(event) {
    const next = event.target.value;
    setCollege(next);
    if (!coursesForCollege(next).some((item) => item.name === course)) setCourse('');
  }

  return (
    <form action={formAction} className={styles.form}>
      <FormMessage state={state} />

      <fieldset className={styles.fieldset}>
        <legend>Personal information</legend>
        <div className={styles.grid}>
          <div>
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" name="firstName" defaultValue={firstName} placeholder="Enter your first name" autoComplete="given-name" required maxLength={75} />
          </div>
          <div>
            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" name="lastName" defaultValue={lastName} placeholder="Enter your last name" autoComplete="family-name" required maxLength={75} />
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
            <label htmlFor="college">College/Program</label>
            <select id="college" name="college" value={college} onChange={handleCollegeChange} required>
              <option value="" disabled>Select your college/program</option>
              {UA_COLLEGES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="course">Course</label>
            <select
              id="course"
              name="course"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              required={courses.length > 0}
              disabled={!college || courses.length === 0}
            >
              <option value="" disabled>Select your course</option>
              {courses.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
            {college && courses.length === 0 && (
              <p className={styles.hint}>No courses are listed for this college yet. You can leave this empty.</p>
            )}
            {!college && <p className={styles.hint}>Select your college/program first.</p>}
          </div>
          <div>
            <label htmlFor="yearLevel">Year level</label>
            <select id="yearLevel" name="yearLevel" defaultValue={academic.yearLevel} required>
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
