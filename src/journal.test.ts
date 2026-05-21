import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, upsertEntry, validateEntry } from './journal';

describe('journal validation and upsert', () => {
  it('accepts a valid entry and normalizes the note', () => {
    const result = validateEntry({
      date: '2026-05-21',
      mood: 'calm',
      energy: 4,
      focus: 3,
      note: '  reviewed <plan> & shipped  ',
      schemaVersion: CURRENT_SCHEMA_VERSION
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entry.note).toBe('reviewed &lt;plan&gt; &amp; shipped');
      expect(result.entry.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    }
  });

  it('rejects invalid date, blank mood, out-of-range ratings, and too-long notes', () => {
    const result = validateEntry({
      date: '2026-02-31',
      mood: ' ',
      energy: 6,
      focus: 0,
      note: 'x'.repeat(481),
      schemaVersion: CURRENT_SCHEMA_VERSION
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('date'),
          expect.stringContaining('mood'),
          expect.stringContaining('energy'),
          expect.stringContaining('focus'),
          expect.stringContaining('note')
        ])
      );
    }
  });

  it('replaces duplicate dates without mutating inputs', () => {
    const previous = [
      {
        date: '2026-05-20',
        mood: 'steady',
        energy: 3,
        focus: 3,
        note: 'baseline',
        schemaVersion: CURRENT_SCHEMA_VERSION
      },
      {
        date: '2026-05-21',
        mood: 'tired',
        energy: 2,
        focus: 2,
        note: 'old note',
        schemaVersion: CURRENT_SCHEMA_VERSION
      }
    ];

    const next = upsertEntry(previous, {
      date: '2026-05-21',
      mood: 'bright',
      energy: 5,
      focus: 4,
      note: 'new note',
      schemaVersion: CURRENT_SCHEMA_VERSION
    });

    expect(previous[1]?.mood).toBe('tired');
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ date: '2026-05-21', mood: 'bright', note: 'new note' });
  });
});
