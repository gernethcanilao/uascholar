import { formatDate } from '@/lib/format';
import styles from './DocumentList.module.css';

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

/** Lists uploaded documents. Downloads go through /api/documents/[id], which checks access and decrypts. */
export default function DocumentList({ documents }) {
  if (!documents.length) return <p className={styles.empty}>No documents uploaded.</p>;

  return (
    <ul className={styles.list}>
      {documents.map((doc) => (
        <li key={doc.id} className={styles.item}>
          <div>
            <strong>{doc.document_type}</strong>
            <span className={styles.meta}>
              {doc.fileName} · {formatSize(doc.size_bytes)} · {formatDate(doc.uploaded_at)}
            </span>
          </div>
          <a href={`/api/documents/${doc.id}`} className={styles.download}>Download</a>
        </li>
      ))}
    </ul>
  );
}
