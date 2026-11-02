import 'server-only';
import { randomUUID } from 'node:crypto';
import { encryptStudentData, encryptStudentFile } from '@/app/_lib/aes-encryption';

const BUCKET = 'documents';

/**
 * Encrypts a validated upload with the student AES key, stores it in the private
 * "documents" bucket and records it in the documents table.
 */
export async function saveEncryptedDocument(supabase, { studentId, applicationId, documentType, file }) {
  const storagePath = `${studentId}/${applicationId}/${randomUUID()}.enc`;
  const encrypted = encryptStudentFile(file.buffer, studentId);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, encrypted, { contentType: 'application/octet-stream', upsert: false });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { error: insertError } = await supabase.from('documents').insert({
    application_id: applicationId,
    student_id: studentId,
    document_type: documentType,
    file_name_encrypted: encryptStudentData(file.fileName, studentId),
    storage_path: storagePath,
    mime_type: file.mimeType,
    size_bytes: file.buffer.length,
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Saving document failed: ${insertError.message}`);
  }
}

/** Downloads the encrypted bytes. Storage RLS decides whether the user may read it. */
export async function downloadEncryptedDocument(supabase, storagePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
