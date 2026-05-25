import { describe, expect, it } from 'vitest';
import { normalizeEntries } from './journal';
import {
  DEMO_JOURNAL_ENTRIES,
  buildDemoScreenshotChecklist,
  createDemoEntries,
  createSafeNotePreview
} from './demoFixtures';

describe('demo fixtures', () => {
  it('exports deterministic, normalized entries sorted by date', () => {
    const first = createDemoEntries();
    const second = createDemoEntries();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.map((entry) => entry.date)).toEqual([
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22'
    ]);
    expect(new Set(first.map((entry) => entry.mood)).size).toBeGreaterThan(2);
    expect(new Set(first.map((entry) => entry.energy)).size).toBeGreaterThan(2);
    expect(new Set(first.map((entry) => entry.focus)).size).toBeGreaterThan(2);
    expect(first.some((entry) => /[*_[\]`<>]/.test(entry.note))).toBe(true);
    expect(normalizeEntries(first)).toEqual({ entries: first, issues: [] });
  });

  it('builds a stable checklist with date range, count, states, and note previews', () => {
    const checklist = buildDemoScreenshotChecklist();

    expect(checklist).toEqual({
      title: 'Mood Mosaic demo screenshot checklist',
      dateRange: { start: '2026-05-18', end: '2026-05-22' },
      entryCount: 5,
      recommendedUiStates: [
        'All time summary with full mosaic visible',
        'This week trend range for 2026-05-21',
        'Recent entries search filtered by note text',
        'Backup panel showing export-ready guidance',
        'Import dry run preview before confirmation'
      ],
      notePreviews: [
        'Planning reset: protect focus blocks \\*before\\* chat.',
        'Low battery, kept scope tiny; no secret \\[redacted token\\].',
        'Pair review helped; captured &lt;edge cases&gt; &amp; risks.',
        'Deep work sprint, wrote docs with \\`stable fixtures\\`.',
        'Retro notes: energy up, focus steady, ship checklist?'
      ],
      summary:
        'Mood Mosaic demo screenshot checklist: 5 entries from 2026-05-18 to 2026-05-22. Capture All time summary with full mosaic visible; This week trend range for 2026-05-21; Recent entries search filtered by note text; Backup panel showing export-ready guidance; Import dry run preview before confirmation.'
    });
  });

  it('normalizes, redacts, escapes, and truncates note previews deterministically', () => {
    const preview = createSafeNotePreview(
      '  Contact me@example.com <b>now</b>\nUse sk-demo-secret-123456 and **bold** marker.  ',
      56
    );

    expect(preview).toBe(
      'Contact \\[redacted email\\] &lt;b&gt;now&lt;/b&gt; Use...'
    );
    expect(preview).not.toContain('me@example.com');
    expect(preview).not.toContain('sk-demo-secret-123456');
    expect(preview).not.toContain('<b>');
    expect(preview).not.toContain('**');
  });

  it('does not mutate input entries or expose shared mutable fixture objects', () => {
    const entries = createDemoEntries();
    const before = structuredClone(entries);
    const checklist = buildDemoScreenshotChecklist(entries);

    entries[0] = {
      ...entries[0],
      date: '2026-01-01',
      note: 'changed after checklist'
    };

    expect(checklist.dateRange).toEqual({ start: '2026-05-18', end: '2026-05-22' });
    expect(before).toEqual(createDemoEntries());
    expect(DEMO_JOURNAL_ENTRIES[0]?.date).toBe('2026-05-18');
  });
});
