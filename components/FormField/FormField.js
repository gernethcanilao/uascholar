import styles from './FormField.module.css';

/** Field label with a red * for required fields and "(optional)" for optional ones. */
export function FieldLabel({ htmlFor, required = false, children }) {
  return (
    <label htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className={styles.required} aria-hidden="true">*</span>
      ) : (
        <span className={styles.optional}>(optional)</span>
      )}
    </label>
  );
}

/** Validation message shown under a field. `id` is referenced by the input's aria-describedby. */
export function FieldError({ id, message }) {
  if (!message) return null;
  return <p id={id} className={styles.error} role="alert">{message}</p>;
}

/** "Fields marked * are required." note shown at the top of a form. */
export function RequiredLegend() {
  return (
    <p className={styles.legend}>
      Fields marked <span className={styles.required} aria-hidden="true">*</span> are required.
    </p>
  );
}

/** Props that link an input to its error message for screen readers and the red border. */
export function errorProps(name, errors) {
  return errors?.[name]
    ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` }
    : {};
}
