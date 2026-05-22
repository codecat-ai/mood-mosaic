import { describe, expect, it } from 'vitest';
import { formatBackupTimestamp } from './backupTimestamps';

describe('backup timestamps', () => {
  it('formats valid timestamps compactly', () => {
    expect(formatBackupTimestamp('2026-05-22T09:07:30.000Z')).toBe(
      'May 22, 2026, 9:07 AM UTC'
    );
  });

  it('falls back gracefully for missing or invalid timestamps', () => {
    expect(formatBackupTimestamp(null)).toBe('Timestamp unavailable');
    expect(formatBackupTimestamp('')).toBe('Timestamp unavailable');
    expect(formatBackupTimestamp('not-a-date')).toBe('Timestamp unavailable');
  });
});
