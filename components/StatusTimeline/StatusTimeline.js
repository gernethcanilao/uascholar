import { formatDateTime } from '@/lib/format';
import styles from './StatusTimeline.module.css';

/** Visual tracker: Submitted → Under review → Approved / Rejected. */
export default function StatusTimeline({ status, submittedAt, reviewedAt }) {
  const isDecided = status === 'approved' || status === 'rejected';

  const steps = [
    { label: 'Submitted', detail: formatDateTime(submittedAt), state: 'done' },
    { label: 'Under review', detail: isDecided ? 'Completed' : 'The Scholarship Office is reviewing your application', state: isDecided ? 'done' : 'current' },
    {
      label: status === 'rejected' ? 'Rejected' : 'Approved',
      detail: isDecided ? formatDateTime(reviewedAt) : 'Waiting for decision',
      state: isDecided ? status : 'upcoming',
    },
  ];

  return (
    <ol className={styles.timeline}>
      {steps.map((step) => (
        <li key={step.label} className={`${styles.step} ${styles[step.state]}`}>
          <span className={styles.dot} aria-hidden="true" />
          <div>
            <strong>{step.label}</strong>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
