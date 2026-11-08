/** Shown when an announcement's publisher cannot be verified (e.g. its author was removed). */
export const ANNOUNCEMENT_SOURCE_FALLBACK = 'Administration';

/**
 * Who published an announcement, e.g. "Academic Scholarship Admin" or "General Admin".
 * The label is computed and stored by the database (announcements_set_source trigger) from the
 * author's role and the scholarship the announcement is for, so it is never taken from user input.
 */
export function announcementSource(announcement) {
  return announcement?.source_label || ANNOUNCEMENT_SOURCE_FALLBACK;
}

// "*" instead of a column list so pages keep working before the source_label migration is applied
// (the label then falls back to "Administration"). Announcements hold no confidential columns.
export const ANNOUNCEMENT_COLUMNS = '*';
