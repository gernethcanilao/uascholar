'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireSuperAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isUuid, readText, readLines, readChoice, slugify, ValidationError } from '@/lib/validation';
import { SCHOLARSHIP_CATEGORIES } from '@/lib/constants';
import { toActionError, pickFormValues } from '@/lib/actions';

const FORM_FIELDS = ['name', 'category', 'summary', 'benefits', 'eligibility', 'applicationProcess', 'requiredDocuments', 'deadline', 'isActive'];

function readScholarshipForm(formData) {
  const name = readText(formData, 'name', { label: 'Name', required: true, max: 150 });
  const deadline = readText(formData, 'deadline', { label: 'Deadline', max: 10 });
  if (deadline && Number.isNaN(Date.parse(deadline))) throw new ValidationError('Please enter a valid deadline.');

  return {
    name,
    slug: slugify(name),
    category: readChoice(formData, 'category', SCHOLARSHIP_CATEGORIES, { label: 'category' }),
    summary: readText(formData, 'summary', { label: 'Summary', required: true, max: 500 }),
    benefits: readLines(formData, 'benefits', { label: 'Benefits' }),
    eligibility: readLines(formData, 'eligibility', { label: 'Eligibility' }),
    application_process: readLines(formData, 'applicationProcess', { label: 'Application process' }),
    required_documents: readLines(formData, 'requiredDocuments', { label: 'Required documents', maxItems: 10, maxLength: 100 }),
    deadline: deadline || null,
    is_active: formData.get('isActive') === 'on',
  };
}

function friendlyDbError(error) {
  if (error?.code === '23505') return new ValidationError('A scholarship with this name already exists.');
  return error;
}

export async function createScholarship(prevState, formData) {
  await requireSuperAdmin();

  try {
    const values = readScholarshipForm(formData);
    const supabase = await createClient();
    const { error } = await supabase.from('scholarships').insert(values);
    if (error) throw friendlyDbError(error);
  } catch (error) {
    return { ...toActionError(error), values: pickFormValues(formData, FORM_FIELDS) };
  }

  revalidatePath('/', 'layout');
  redirect('/admin/scholarships');
}

export async function updateScholarship(prevState, formData) {
  await requireAdmin();
  const id = formData.get('id');

  try {
    if (!isUuid(id)) throw new ValidationError('Invalid scholarship.');
    const values = readScholarshipForm(formData);

    const supabase = await createClient();
    // RLS: super admins can edit any scholarship; admins only their assigned ones.
    const { data, error } = await supabase.from('scholarships').update(values).eq('id', id).select('id');
    if (error) throw friendlyDbError(error);
    if (!data?.length) throw new ValidationError('You do not have permission to edit this scholarship.');
  } catch (error) {
    return { ...toActionError(error), values: pickFormValues(formData, FORM_FIELDS) };
  }

  revalidatePath('/', 'layout');
  redirect('/admin/scholarships');
}

export async function deleteScholarship(formData) {
  await requireSuperAdmin();
  const id = formData.get('id');
  if (!isUuid(id)) return;

  const supabase = await createClient();
  const { error } = await supabase.from('scholarships').delete().eq('id', id);

  if (error?.code === '23503') {
    // Scholarship already has applications: hide it instead of destroying student records.
    await supabase.from('scholarships').update({ is_active: false }).eq('id', id);
  } else if (error) {
    console.error('Delete scholarship failed:', error.message);
  }

  revalidatePath('/', 'layout');
}
