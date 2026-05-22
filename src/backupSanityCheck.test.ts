import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION } from './journal';
import { summarizeBackupJson } from './backupSanityCheck';

describe('backup sanity check', () => {
  it('summarizes a valid backup with two entries and a date range', () => {
    const summary = summarizeBackupJson(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: [
          { date: '2026-05-20', mood: 'steady', energy: 4, focus: 4, note: 'One' },
          { date: '2026-05-21', mood: 'bright', energy: 5, focus: 5, note: 'Two' }
        ]
      })
    );

    expect(summary).toEqual({
      isJsonValid: true,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      rawEntryCount: 2,
      validEntryCount: 2,
      issueCount: 0,
      issues: [],
      dateRange: { start: '2026-05-20', end: '2026-05-21' },
      summary: 'Valid JSON. Schema version 1. Found 2 raw entries and 2 valid entries from 2026-05-20 to 2026-05-21.'
    });
  });

  it('reports invalid JSON without accepting entries', () => {
    const summary = summarizeBackupJson('{nope');

    expect(summary.isJsonValid).toBe(false);
    expect(summary.schemaVersion).toBeNull();
    expect(summary.rawEntryCount).toBeNull();
    expect(summary.validEntryCount).toBe(0);
    expect(summary.issueCount).toBe(1);
    expect(summary.issues).toEqual(['Backup must be valid JSON.']);
    expect(summary.dateRange).toBeNull();
    expect(summary.summary).toBe('Invalid JSON. Backup must be valid JSON.');
  });

  it('reports an object whose entries field is not an array', () => {
    const summary = summarizeBackupJson(JSON.stringify({ schemaVersion: 1, entries: {} }));

    expect(summary.isJsonValid).toBe(true);
    expect(summary.schemaVersion).toBe(1);
    expect(summary.rawEntryCount).toBeNull();
    expect(summary.validEntryCount).toBe(0);
    expect(summary.issueCount).toBe(1);
    expect(summary.issues).toEqual(['Backup entries must be an array.']);
    expect(summary.dateRange).toBeNull();
  });

  it('counts valid and invalid records from an entries array', () => {
    const summary = summarizeBackupJson(
      JSON.stringify({
        entries: [
          { date: '2026-05-20', mood: 'steady', energy: 4, focus: 4, note: 'One' },
          { date: 'not-a-date', mood: 'bright', energy: 5, focus: 5, note: 'Two' }
        ]
      })
    );

    expect(summary.isJsonValid).toBe(true);
    expect(summary.schemaVersion).toBeNull();
    expect(summary.rawEntryCount).toBe(2);
    expect(summary.validEntryCount).toBe(1);
    expect(summary.issueCount).toBe(1);
    expect(summary.issues).toEqual(['Entry 2: Entry date must be a valid YYYY-MM-DD date.']);
    expect(summary.dateRange).toEqual({ start: '2026-05-20', end: '2026-05-20' });
  });

  it('is safe for whitespace input', () => {
    const summary = summarizeBackupJson('   \n\t  ');

    expect(summary).toMatchObject({
      isJsonValid: false,
      schemaVersion: null,
      rawEntryCount: null,
      validEntryCount: 0,
      issueCount: 1,
      issues: ['Paste backup JSON to check it.'],
      dateRange: null,
      summary: 'No JSON pasted yet. Paste backup JSON to check it.'
    });
  });
});
