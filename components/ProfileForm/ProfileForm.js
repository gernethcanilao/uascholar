'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { updateStudentProfile } from '@/app/student/profile/actions';
import { YEAR_LEVELS, UA_COLLEGES, coursesForCollege } from '@/lib/constants';
import { formatPersonName, normalizeSuffix, SUFFIX_EXAMPLES } from '@/lib/names';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import FormMessage from '@/components/FormMessage/FormMessage';
import { FieldLabel, FieldError, RequiredLegend, errorProps } from '@/components/FormField/FormField';
import styles from './ProfileForm.module.css';

const REQUIRED = {
  firstName: 'First name is required.',
  lastName: 'Last name is required.',
  studentNumber: 'Student number is required.',
  phone: 'Contact number is required.',
  college: 'College is required.',
  course: 'Program is required.',
  yearLevel: 'Year level is required.',
};

/** Quick checks in the browser; the server repeats all of them (they cannot be bypassed). */
function validate(data) {
  const errors = {};
  for (const [field, message] of Object.entries(REQUIRED)) {
    if (!String(data.get(field) ?? '').trim()) errors[field] = message;
  }
  // The College error already covers an empty Program.
  if (errors.college) delete errors.course;
  if (normalizeSuffix(data.get('suffix')) === null) {
    errors.suffix = `Use a suffix such as ${SUFFIX_EXAMPLES}, or leave it blank.`;
  }
  return errors;
}

export default function ProfileForm({ email, firstName, lastName, suffix, personal, academic }) {
  const [state, formAction] = useActionState(updateStudentProfile, null);
  const [saving, startSaving] = useTransition();
  const [errors, setErrors] = useState({});

  // After a failed save, keep what the student typed instead of resetting to the saved profile.
  // (Names go after ...personal: a profile that was never saved has empty firstName/lastName there.)
  const v = state?.values ?? {
    ...personal,
    firstName,
    lastName,
    suffix,
    college: academic.college,
    course: academic.course,
    yearLevel: academic.yearLevel,
  };

  // Saved values that are no longer in the official list are not guessed: the student picks again.
  const outdatedCollege = academic.college && !UA_COLLEGES.includes(academic.college) ? academic.college : '';
  const savedCourseIsValid = coursesForCollege(academic.college).some((item) => item.name === academic.course);
  const outdatedCourse = !outdatedCollege && academic.course && !savedCourseIsValid ? academic.course : '';

  // College and Program are linked: the Program list shows only the programs of the selected college.
  const [college, setCollege] = useState(outdatedCollege ? '' : academic.college);
  const courses = coursesForCollege(college);
  const [course, setCourse] = useState(savedCourseIsValid ? academic.course : '');

  // After each response: show the server's field messages and keep the dropdowns on the submitted values.
  useEffect(() => {
    setErrors(state?.fieldErrors ?? {});
    if (!state?.values) return;
    setCollege(UA_COLLEGES.includes(state.values.college) ? state.values.college : '');
    setCourse(state.values.course ?? '');
  }, [state]);

  const hasBrowserErrors = Object.keys(errors).length > 0 && !state?.fieldErrors;

  // Submit without React's automatic form reset, which would blank the dropdowns after saving.
  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      form.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    startSaving(() => formAction(data));
  }

  // Remove a field's message as soon as the student edits it.
  function clearError(event) {
    const { name } = event.target;
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  }

  function handleCollegeChange(event) {
    const next = event.target.value;
    setCollege(next);
    // A program from another college is cleared and must be chosen again.
    if (!coursesForCollege(next).some((item) => item.name === course)) setCourse('');
  }

  // Proper name case when leaving the field: "mARY aVELAINE" -> "Mary Avelaine".
  function formatName(event) {
    event.target.value = formatPersonName(event.target.value);
  }

  function formatSuffix(event) {
    const value = normalizeSuffix(event.target.value);
    if (value !== null) event.target.value = value;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} onChange={clearError} className={styles.form} noValidate>
      <RequiredLegend />

      <fieldset className={styles.fieldset}>
        <legend>Personal information</legend>
        <div className={styles.grid}>
          <div>
            <FieldLabel htmlFor="firstName" required>First Name</FieldLabel>
            <input id="firstName" name="firstName" defaultValue={v.firstName} onBlur={formatName} placeholder="Enter your first name" autoComplete="given-name" required maxLength={75} {...errorProps('firstName', errors)} />
            <FieldError id="firstName-error" message={errors.firstName} />
          </div>
          <div>
            <FieldLabel htmlFor="lastName" required>Last Name</FieldLabel>
            <input id="lastName" name="lastName" defaultValue={v.lastName} onBlur={formatName} placeholder="Enter your last name" autoComplete="family-name" required maxLength={75} {...errorProps('lastName', errors)} />
            <FieldError id="lastName-error" message={errors.lastName} />
          </div>
          <div>
            <FieldLabel htmlFor="suffix">Suffix</FieldLabel>
            <input id="suffix" name="suffix" defaultValue={v.suffix} onBlur={formatSuffix} placeholder="e.g. Jr., III" autoComplete="honorific-suffix" maxLength={10} {...errorProps('suffix', errors)} />
            <FieldError id="suffix-error" message={errors.suffix} />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} disabled readOnly />
          </div>
          <div>
            <FieldLabel htmlFor="studentNumber" required>Student number</FieldLabel>
            <input id="studentNumber" name="studentNumber" defaultValue={v.studentNumber} required maxLength={30} {...errorProps('studentNumber', errors)} />
            <FieldError id="studentNumber-error" message={errors.studentNumber} />
          </div>
          <div>
            <FieldLabel htmlFor="phone" required>Contact number</FieldLabel>
            <input id="phone" name="phone" type="tel" defaultValue={v.phone} placeholder="e.g. 09171234567" required maxLength={20} {...errorProps('phone', errors)} />
            <FieldError id="phone-error" message={errors.phone} />
          </div>
          <div>
            <FieldLabel htmlFor="birthdate">Birthdate</FieldLabel>
            <input id="birthdate" name="birthdate" type="date" defaultValue={v.birthdate} {...errorProps('birthdate', errors)} />
            <FieldError id="birthdate-error" message={errors.birthdate} />
          </div>
          <div className={styles.full}>
            <FieldLabel htmlFor="address">Home address</FieldLabel>
            <input id="address" name="address" defaultValue={v.address} maxLength={300} {...errorProps('address', errors)} />
            <FieldError id="address-error" message={errors.address} />
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Academic information</legend>
        <div className={styles.grid}>
          <div className={styles.full}>
            <FieldLabel htmlFor="college" required>College</FieldLabel>
            <select id="college" name="college" value={college} onChange={handleCollegeChange} required {...errorProps('college', errors)}>
              <option value="" disabled>Select your college</option>
              {UA_COLLEGES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <FieldError id="college-error" message={errors.college} />
            {outdatedCollege && (
              <p className={styles.notice}>
                Your saved college &ldquo;{outdatedCollege}&rdquo; is no longer in the list. Please select your college and program.
              </p>
            )}
          </div>
          <div className={styles.full}>
            <FieldLabel htmlFor="course" required>Program</FieldLabel>
            <select
              id="course"
              name="course"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              required
              disabled={!college}
              {...errorProps('course', errors)}
            >
              <option value="" disabled>Select your program</option>
              {courses.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
            <FieldError id="course-error" message={errors.course} />
            {outdatedCourse && (
              <p className={styles.notice}>
                Your saved program &ldquo;{outdatedCourse}&rdquo; is no longer in the list. Please select your program.
              </p>
            )}
            {!college && <p className={styles.hint}>Select your college first.</p>}
          </div>
          <div>
            <FieldLabel htmlFor="yearLevel" required>Year level</FieldLabel>
            <select id="yearLevel" name="yearLevel" defaultValue={v.yearLevel} required {...errorProps('yearLevel', errors)}>
              <option value="" disabled>Select year level</option>
              {YEAR_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <FieldError id="yearLevel-error" message={errors.yearLevel} />
          </div>
        </div>
      </fieldset>

      <div className={styles.actions}>
        {/* The only place the save result is shown (once per save), right next to the button.
            Hidden while the browser check has found missing fields, so an older "saved" message is not left showing. */}
        <div className={styles.actionMessage}>{!hasBrowserErrors && <FormMessage state={state} />}</div>
        <SubmitButton pendingText="Saving..." pending={saving}>Save profile</SubmitButton>
      </div>
    </form>
  );
}
