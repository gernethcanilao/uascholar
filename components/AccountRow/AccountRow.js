'use client';

import { useActionState } from 'react';
import { updateAccount } from '@/app/admin/accounts/actions';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton/SubmitButton';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './AccountRow.module.css';

/** One row of the account table with "change role" and "activate/deactivate" forms. */
export default function AccountRow({ account, isSelf }) {
  const [roleState, roleAction] = useActionState(updateAccount, null);
  const [statusState, statusAction] = useActionState(updateAccount, null);
  const error = roleState?.error || statusState?.error;

  return (
    <tr>
      <td>
        <strong>{account.full_name || '—'}</strong>
        {isSelf && <span className={styles.you}>You</span>}
        <span className={styles.email}>{account.email}</span>
        {error && <span className={styles.error}>{error}</span>}
      </td>
      <td>{formatDate(account.created_at)}</td>
      <td>
        {isSelf ? (
          ROLE_LABELS[account.role]
        ) : (
          <form action={roleAction} className={styles.inline}>
            <input type="hidden" name="userId" value={account.id} />
            <input type="hidden" name="intent" value="role" />
            <select name="role" defaultValue={account.role} aria-label="Role">
              {Object.values(ROLES).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </select>
            <SubmitButton variant="outline" pendingText="...">Save</SubmitButton>
          </form>
        )}
      </td>
      <td>
        <div className={styles.inline}>
          <StatusBadge status={account.is_active ? 'active' : 'inactive'} />
          {!isSelf && (
            <form action={statusAction}>
              <input type="hidden" name="userId" value={account.id} />
              <input type="hidden" name="intent" value="status" />
              <input type="hidden" name="isActive" value={account.is_active ? 'false' : 'true'} />
              <SubmitButton variant={account.is_active ? 'danger' : 'success'} pendingText="...">
                {account.is_active ? 'Deactivate' : 'Activate'}
              </SubmitButton>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
