import { describe, expect, it } from 'vitest';
import { buildMosaicCells, buildSummary, createCopySummary } from './summary';
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
});
