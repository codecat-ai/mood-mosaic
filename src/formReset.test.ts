import { describe, expect, it } from 'vitest';
import { createResetFormState } from './formReset';
import type { JournalEntry } from './journal';

describe('createResetFormState', () => {
  it('returns the selected date saved entry values when one exists', () => {
    const entries: JournalEntry[] = [
      entry('2026-05-20', 'steady', 4, 2, 'Saved note'),
      entry('2026-05-21', 'focused', 5, 5, 'Other day')
    ];

    expect(createResetFormState(entries, '2026-05-20')).toEqual({
      mood: 'steady',
      energy: '4',
      focus: '2',
      note: 'Saved note'
    });
  });

  it('returns default empty values when the selected date has no saved entry', () => {
    expect(createResetFormState([], '2026-05-22')).toEqual({
      mood: 'calm',
      energy: '3',
      focus: '3',
      note: ''
    });
  });

  it('does not mutate saved entries while deriving reset values', () => {
    const entries: JournalEntry[] = [entry('2026-05-20', 'reflective', 2, 4, 'Keep saved')];

    const reset = createResetFormState(entries, '2026-05-20');
    reset.note = 'Changed form only';

    expect(entries[0]).toMatchObject({
      date: '2026-05-20',
      mood: 'reflective',
      energy: 2,
      focus: 4,
      note: 'Keep saved'
    });
  });
});

function entry(
  date: string,
  mood: string,
  energy: number,
  focus: number,
  note: string
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
