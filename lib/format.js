// Every date and time is shown in Philippine Standard Time (UTC+8), whatever the timezone of the
// server or the viewer's device. Timestamps stay stored in UTC; Intl converts them (no manual +8 hours).
export const APP_TIME_ZONE = 'Asia/Manila';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: APP_TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: APP_TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : '—';
}

export function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : '—';
}

export function formatPeso(value) {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}
