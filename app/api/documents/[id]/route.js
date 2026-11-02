import { getCurrentUser, canAccessScholarship } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { decryptStudentData, decryptStudentFile } from '@/app/_lib/aes-encryption';
import { downloadEncryptedDocument } from '@/lib/documents';
import { isUuid, sanitizeFileName } from '@/lib/validation';

/**
 * Secure document download.
 * 1. User must be logged in and active.
 * 2. RLS only returns the document if the user owns it or administers its scholarship.
 * 3. The file is decrypted on the server and streamed back; it is never public.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response('Not found', { status: 404 });

  const current = await getCurrentUser();
  if (!current) return new Response('Unauthorized', { status: 401 });

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from('documents')
    .select('student_id, storage_path, mime_type, file_name_encrypted, application:applications(scholarship_id)')
    .eq('id', id)
    .maybeSingle();

  if (!doc) return new Response('Not found', { status: 404 });

  // Second check before decrypting: the owner student, or an admin assigned to this scholarship.
  const { profile } = current;
  const isOwner = profile.role === ROLES.STUDENT && doc.student_id === profile.id;
  if (!isOwner && !(await canAccessScholarship(profile, doc.application?.scholarship_id))) {
    return new Response('Not found', { status: 404 });
  }

  const encrypted = await downloadEncryptedDocument(supabase, doc.storage_path);
  if (!encrypted) return new Response('Not found', { status: 404 });

  let fileBytes;
  try {
    fileBytes = decryptStudentFile(encrypted, doc.student_id);
  } catch (error) {
    console.error('Document decryption failed:', error.message);
    return new Response('Unable to open document', { status: 500 });
  }

  const fileName = sanitizeFileName(decryptStudentData(doc.file_name_encrypted, doc.student_id, 'document'));
  const asciiFileName = fileName.replace(/[^\x20-\x7e]/g, '_'); // HTTP headers must be ASCII

  return new Response(fileBytes, {
    headers: {
      'Content-Type': doc.mime_type,
      'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
