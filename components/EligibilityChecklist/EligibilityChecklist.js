'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './EligibilityChecklist.module.css';

/** Interactive checklist: the "Proceed" button unlocks when every requirement is ticked. */
export default function EligibilityChecklist({ items = [], documents = [], applyHref }) {
  const [checked, setChecked] = useState(() => items.map(() => false));
  const allChecked = checked.every(Boolean);

  function toggle(index) {
    setChecked((previous) => previous.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <div className={styles.wrapper}>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={item}>
            <label className={`${styles.item} ${checked[index] ? styles.done : ''}`}>
              <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>

      {documents.length > 0 && (
        <div className={styles.documents}>
          <strong>Prepare these documents (PDF, PNG or JPG, max 5 MB each):</strong>
          <ul>
            {documents.map((doc) => <li key={doc}>{doc}</li>)}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.progress}>
          {checked.filter(Boolean).length} of {items.length} requirements met
        </span>
        {allChecked ? (
          <Link href={applyHref} className={styles.proceed}>Proceed to application →</Link>
        ) : (
          <span className={styles.locked} aria-disabled="true">Proceed to application</span>
        )}
      </div>
    </div>
  );
}
