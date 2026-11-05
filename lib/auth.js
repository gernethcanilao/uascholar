import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { ROLES } from './constants';
import { isUaEmail } from './validation';

/**
 * Returns { user, profile } for the logged-in, active user, or null.
 * Cached per request so layouts and pages can call it freely.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) return null;
  // Student accounts are only valid with a UA email (admin accounts are authorized by role).
  if (profile.role === ROLES.STUDENT && !isUaEmail(profile.email)) return null;
  return { user, profile };
});

export function dashboardPathFor(role) {
  return role === ROLES.STUDENT ? '/student/dashboard' : '/admin/dashboard';
}

/** Call at the top of every protected page AND every Server Action. */
async function requireRole(allowedRoles) {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!allowedRoles.includes(current.profile.role)) redirect(dashboardPathFor(current.profile.role));
  return current;
}

/**
 * D2 rule: "Each scholarship administrator can only access the information
 * permitted for their assigned scholarship."
 * The database (RLS) already enforces this; this second check runs in the app
 * BEFORE any confidential record is decrypted (defense in depth).
 */
export async function canAccessScholarship(profile, scholarshipId) {
  if (!profile || !scholarshipId) return false;
  if (profile.role === ROLES.SUPER_ADMIN) return true;
  if (profile.role !== ROLES.ADMIN) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from('admin_assignments')
    .select('scholarship_id')
    .eq('admin_id', profile.id)
    .eq('scholarship_id', scholarshipId)
    .maybeSingle();
  return Boolean(data);
}

/** All scholarship ids this admin may access, or null for "all" (super admin). */
export async function getAccessibleScholarshipIds(profile) {
  if (profile.role === ROLES.SUPER_ADMIN) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('admin_assignments')
    .select('scholarship_id')
    .eq('admin_id', profile.id);
  return (data ?? []).map((row) => row.scholarship_id);
}

export const requireUser = () => requireRole([ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN]);
export const requireStudent = () => requireRole([ROLES.STUDENT]);
export const requireAdmin = () => requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
export const requireSuperAdmin = () => requireRole([ROLES.SUPER_ADMIN]);
