const UNAVAILABLE_TIMESTAMP = 'Timestamp unavailable';

export function formatBackupTimestamp(timestamp: string | null | undefined): string {
  if (!timestamp) {
    return UNAVAILABLE_TIMESTAMP;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return UNAVAILABLE_TIMESTAMP;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(date);
}
