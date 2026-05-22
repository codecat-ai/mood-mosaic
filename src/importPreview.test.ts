import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, type JournalEntry } from './journal';
import {
  IMPORT_DRY_RUN_CURRENT_ENTRIES,
  IMPORT_DRY_RUN_EXAMPLE_JSON,
  createImportDryRunExamplePreview,
  formatRestoreDecisionNote,
  previewJournalImport
} from './importPreview';

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
  it('provides a deterministic dry-run example with one replacement and one new date', () => {
    const preview = createImportDryRunExamplePreview();

    expect(IMPORT_DRY_RUN_EXAMPLE_JSON).toBe(
      '{\n' +
        '  "schemaVersion": 1,\n' +
        '  "entries": [\n' +
        '    {\n' +
        '      "date": "2026-05-20",\n' +
        '      "mood": "steady",\n' +
        '      "energy": 4,\n' +
        '      "focus": 4,\n' +
        '      "note": "Dry-run replacement"\n' +
        '    },\n' +
        '    {\n' +
        '      "date": "2026-05-21",\n' +
        '      "mood": "bright",\n' +
        '      "energy": 5,\n' +
        '      "focus": 5,\n' +
        '      "note": "Dry-run new date"\n' +
        '    }\n' +
        '  ]\n' +
        '}'
    );
    expect(IMPORT_DRY_RUN_CURRENT_ENTRIES.map((entry) => entry.date)).toEqual(['2026-05-20']);
    expect(preview).toMatchObject({
      canProceed: true,
      acceptedEntryCount: 2,
      replaceCount: 1,
      addCount: 1,
      dateRange: { start: '2026-05-20', end: '2026-05-21' },
      summary: 'Ready to import 2 entries from 2026-05-20 to 2026-05-21. 1 existing date will be replaced and 1 new date will be added.'
    });
    expect(preview.issues).toEqual([]);
  });

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

  it('formats restore decision notes from preview counts', () => {
    const replacementOnlyPreview = previewJournalImport(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: [
          {
            date: '2026-05-20',
            mood: 'steady',
            energy: 4,
            focus: 4,
            note: 'Replacement'
          }
        ]
      }),
      existingEntries
    );
    const newDatesOnlyPreview = previewJournalImport(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: [
          {
            date: '2026-05-21',
            mood: 'bright',
            energy: 5,
            focus: 5,
            note: 'New date'
          }
        ]
      }),
      existingEntries
    );
    const mixedPreview = createImportDryRunExamplePreview();
    const emptyPreview = previewJournalImport(
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: []
      }),
      existingEntries
    );
    const issueOnlyPreview = previewJournalImport('{nope', existingEntries);

    expect(formatRestoreDecisionNote(replacementOnlyPreview)).toBe(
      'Confirming restore will replace 1 existing date.'
    );
    expect(formatRestoreDecisionNote(newDatesOnlyPreview)).toBe(
      'Confirming restore will add 1 new date.'
    );
    expect(formatRestoreDecisionNote(mixedPreview)).toBe(
      'Confirming restore will replace 1 existing date and add 1 new date.'
    );
    expect(formatRestoreDecisionNote(emptyPreview)).toBe(
      'No entries are ready to restore yet.'
    );
    expect(formatRestoreDecisionNote(issueOnlyPreview)).toBe(
      'No entries are ready to restore yet. Resolve the preview issue before confirming.'
    );
  });
});
