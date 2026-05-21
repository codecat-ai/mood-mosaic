import { describe, expect, it } from 'vitest';
import { getRecentEntries } from './recentEntries';
import type { JournalEntry } from './journal';

const entries: JournalEntry[] = [
  entry('2026-05-19', 'steady', 3, 4, 'First'),
  entry('2026-05-21', 'focused', 5, 5, 'Latest'),
  entry('2026-05-20', 'calm', 2, 3, 'Middle')
];

describe('getRecentEntries', () => {
  it('returns valid entries sorted newest-first', () => {
    expect(getRecentEntries(entries).map((item) => item.date)).toEqual([
      '2026-05-21',
      '2026-05-20',
      '2026-05-19'
    ]);
  });

  it('uses the default limit and supports smaller limits', () => {
    const manyEntries = [
      entry('2026-05-15'),
      entry('2026-05-16'),
      entry('2026-05-17'),
      entry('2026-05-18'),
      entry('2026-05-19'),
      entry('2026-05-20')
    ];

    expect(getRecentEntries(manyEntries).map((item) => item.date)).toEqual([
      '2026-05-20',
      '2026-05-19',
      '2026-05-18',
      '2026-05-17',
      '2026-05-16'
    ]);
    expect(getRecentEntries(manyEntries, 2).map((item) => item.date)).toEqual([
      '2026-05-20',
      '2026-05-19'
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(getRecentEntries([])).toEqual([]);
  });

  it('clamps invalid and non-positive limits safely', () => {
    expect(getRecentEntries(entries, 0)).toEqual([]);
    expect(getRecentEntries(entries, -4)).toEqual([]);
    expect(getRecentEntries(entries, Number.NaN)).toEqual([]);
    expect(getRecentEntries(entries, 1.8).map((item) => item.date)).toEqual(['2026-05-21']);
  });

  it('filters invalid entries and preserves normalized entry fields', () => {
    const invalidDate = entry('2026-02-30');
    const invalidEnergy = entry('2026-05-22');
    invalidEnergy.energy = 9;

    expect(getRecentEntries([invalidDate, entries[0], invalidEnergy])).toEqual([entries[0]]);
  });

  it('does not mutate the input array or entries', () => {
    const input = entries.map((item) => ({ ...item }));
    const snapshot = input.map((item) => ({ ...item }));

    const result = getRecentEntries(input, 2);

    expect(input).toEqual(snapshot);
    expect(result[0]).not.toBe(input[1]);
  });
});

function entry(
  date: string,
  mood = 'calm',
  energy = 3,
  focus = 3,
  note = 'Note'
): JournalEntry {
  return {
    date,
    mood,
    energy,
    focus,
    note,
    schemaVersion: 1
  };
}
