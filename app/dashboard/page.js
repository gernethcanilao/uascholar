import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathFor } from '@/lib/auth';

/** Sends each user to the dashboard for their role. */
export default async function DashboardRedirect() {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  redirect(dashboardPathFor(current.profile.role));
}
