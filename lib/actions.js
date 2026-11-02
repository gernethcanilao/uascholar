import { ValidationError } from './validation';

/**
 * Converts any error thrown inside a Server Action into a safe message for the UI.
 * Internal details are logged on the server only.
 */
export function toActionError(error) {
  if (error instanceof ValidationError) {
    return { error: error.message };
  }
  console.error('Action failed:', error);
  return { error: 'Something went wrong. Please try again.' };
}

/**
 * Returns the submitted text values so a form can be re-filled after an error
 * (React resets forms after a Server Action). Never include passwords or files.
 */
export function pickFormValues(formData, fields) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === 'string' ? value : ''];
    })
  );
}
