import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, type JournalEntry } from './journal';
import { previewJournalImport } from './importPreview';

const existingEntries: JournalEntry[] = [
  {
    date: '2026-05-20',
    mood: 'calm',
    energy: 3,
    focus: 4,
    note: 'Existing entry',
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
];

describe('import preview', () => {
  it('summarizes accepted entries before saved entries are replaced', () => {
    const preview = previewJournalImport(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: [
          {
            date: '2026-05-20',
            mood: 'steady',
            energy: 4,
            focus: 4,
            note: 'Replacement'
          },
          {
            date: '2026-05-21',
            mood: 'bright',
            energy: 5,
            focus: 5,
            note: 'New date'
          },
          {
            date: 'not-a-date',
            mood: 'tired',
            energy: 2,
            focus: 2,
            note: 'Invalid date'
          }
        ]
      }),
      existingEntries
    );

    expect(preview).toMatchObject({
      canProceed: true,
      acceptedEntryCount: 2,
      dateRange: { start: '2026-05-20', end: '2026-05-21' },
      replaceCount: 1,
      addCount: 1,
      summary: 'Ready to import 2 entries from 2026-05-20 to 2026-05-21. 1 existing date will be replaced and 1 new date will be added.'
    });
    expect(preview.issues).toEqual([
      'Entry 3: Entry date must be a valid YYYY-MM-DD date.'
    ]);
    expect(preview.acceptedEntries.map((entry) => entry.date)).toEqual([
      '2026-05-20',
      '2026-05-21'
    ]);
  });

  it('reports invalid JSON without accepting entries', () => {
    const preview = previewJournalImport('{nope', existingEntries);

    expect(preview.canProceed).toBe(false);
    expect(preview.acceptedEntryCount).toBe(0);
    expect(preview.acceptedEntries).toEqual([]);
    expect(preview.dateRange).toBeNull();
    expect(preview.replaceCount).toBe(0);
    expect(preview.addCount).toBe(0);
    expect(preview.issues).toEqual(['Import must be valid JSON.']);
    expect(preview.summary).toBe('Import cannot proceed. Import must be valid JSON.');
  });

  it('reports unsupported top-level schema without accepting entries', () => {
    const preview = previewJournalImport(JSON.stringify([{ date: '2026-05-21' }]), existingEntries);

    expect(preview.canProceed).toBe(false);
    expect(preview.acceptedEntryCount).toBe(0);
    expect(preview.issues).toEqual(['Import must be a JSON object with an entries array.']);
    expect(preview.summary).toBe(
      'Import cannot proceed. Import must be a JSON object with an entries array.'
    );
  });
});
