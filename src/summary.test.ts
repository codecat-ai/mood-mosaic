import { describe, expect, it } from 'vitest';
import { buildMosaicCells, buildSummary, createCopySummary, filterEntriesByTrend } from './summary';
import { CURRENT_SCHEMA_VERSION, type JournalEntry } from './journal';

const entries: JournalEntry[] = [
  {
    date: '2026-05-21',
    mood: 'focused',
    energy: 5,
    focus: 4,
    note: 'Finished draft',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-19',
    mood: 'calm',
    energy: 3,
    focus: 4,
    note: '<blank>',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-20',
    mood: 'focused',
    energy: 4,
    focus: 5,
    note: '   ',
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
];

describe('summary analytics', () => {
  it('sorts mosaic cells by date and assigns mood colors', () => {
    const cells = buildMosaicCells(entries);

    expect(cells.map((cell) => cell.date)).toEqual(['2026-05-19', '2026-05-20', '2026-05-21']);
    expect(cells.every((cell) => cell.color.startsWith('#'))).toBe(true);
  });

  it('calculates averages, mood counts, and recent consecutive streak', () => {
    const summary = buildSummary(entries);

    expect(summary.averageEnergy).toBe(4);
    expect(summary.averageFocus).toBeCloseTo(4.33, 2);
    expect(summary.moodCounts).toEqual({ calm: 1, focused: 2 });
    expect(summary.currentStreakDays).toBe(3);
    expect(summary.recentNotes).toEqual(['Finished draft']);
  });

  it('creates a concise copy summary without undefined, null, or long notes', () => {
    const copy = createCopySummary([
      ...entries,
      {
        date: '2026-05-18',
        mood: 'reflective',
        energy: 3,
        focus: 3,
        note: `Long ${'note '.repeat(60)}`,
        schemaVersion: CURRENT_SCHEMA_VERSION
      }
    ]);

    expect(copy).toContain('Mood Mosaic summary');
    expect(copy).not.toContain('undefined');
    expect(copy).not.toContain('null');
    expect(copy.length).toBeLessThan(700);
  });

  it('returns all-time entries in summary sort order with a clear label', () => {
    const trend = filterEntriesByTrend(entries, 'all', '2026-05-21');

    expect(trend.entries.map((entry) => entry.date)).toEqual([
      '2026-05-19',
      '2026-05-20',
      '2026-05-21'
    ]);
    expect(trend.label).toBe('All time');
    expect(trend.countLabel).toBe('3 entries');
  });

  it('filters the Monday-Sunday week containing the anchor date', () => {
    const trend = filterEntriesByTrend(
      [
        entry('2026-05-17', 'previous Sunday'),
        entry('2026-05-18', 'week Monday'),
        entry('2026-05-21', 'anchor Thursday'),
        entry('2026-05-24', 'week Sunday'),
        entry('2026-05-25', 'next Monday')
      ],
      'week',
      '2026-05-21'
    );

    expect(trend.entries.map((item) => item.date)).toEqual([
      '2026-05-18',
      '2026-05-21',
      '2026-05-24'
    ]);
    expect(trend.label).toBe('This week: 2026-05-18 to 2026-05-24');
    expect(trend.countLabel).toBe('3 entries');
  });

  it('filters the calendar month containing the anchor date', () => {
    const trend = filterEntriesByTrend(
      [
        entry('2026-04-30'),
        entry('2026-05-01'),
        entry('2026-05-21'),
        entry('2026-05-31'),
        entry('2026-06-01')
      ],
      'month',
      '2026-05-21'
    );

    expect(trend.entries.map((item) => item.date)).toEqual([
      '2026-05-01',
      '2026-05-21',
      '2026-05-31'
    ]);
    expect(trend.label).toBe('This month: May 2026');
    expect(trend.countLabel).toBe('3 entries');
  });

  it('handles empty matching windows and invalid anchors without crashing', () => {
    const emptyWeek = filterEntriesByTrend(entries, 'week', '2026-06-04');
    const invalidAnchor = filterEntriesByTrend(entries, 'week', 'not-a-date');

    expect(emptyWeek.entries).toEqual([]);
    expect(emptyWeek.label).toBe('This week: 2026-06-01 to 2026-06-07');
    expect(emptyWeek.countLabel).toBe('No entries');
    expect(invalidAnchor.entries.map((entry) => entry.date)).toEqual([
      '2026-05-19',
      '2026-05-20',
      '2026-05-21'
    ]);
    expect(invalidAnchor.label).toBe('All time');
  });
});

function entry(date: string, note = 'Note'): JournalEntry {
  return {
    date,
    mood: 'calm',
    energy: 3,
    focus: 3,
    note,
    schemaVersion: CURRENT_SCHEMA_VERSION
  };
}
