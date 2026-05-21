import { describe, expect, it } from 'vitest';
import { MAX_NOTE_LENGTH } from './journal';
import { getEntryValidationHints } from './entryValidationHints';

describe('getEntryValidationHints', () => {
  it('returns no hints for ordinary valid entry form input', () => {
    expect(
      getEntryValidationHints({
        date: '2026-05-21',
        mood: 'calm',
        energy: '3',
        focus: '4',
        note: 'Short reflection'
      })
    ).toEqual([]);
  });

  it('guides empty or invalid date selections before save is attempted', () => {
    expect(
      getEntryValidationHints({
        date: '',
        mood: 'calm',
        energy: '3',
        focus: '4',
        note: ''
      })
    ).toEqual([
      expect.objectContaining({
        id: 'entry-date-hint',
        field: 'date',
        message: 'Choose a real calendar date before saving.'
      })
    ]);

    expect(
      getEntryValidationHints({
        date: '2026-02-31',
        mood: 'calm',
        energy: '3',
        focus: '4',
        note: ''
      })
    ).toEqual([
      expect.objectContaining({
        id: 'entry-date-hint',
        field: 'date',
        message: 'Choose a real calendar date before saving.'
      })
    ]);
  });

  it('warns gently when the note is close to the saved-entry maximum', () => {
    const hints = getEntryValidationHints({
      date: '2026-05-21',
      mood: 'steady',
      energy: '3',
      focus: '3',
      note: 'x'.repeat(MAX_NOTE_LENGTH - 10)
    });

    expect(hints).toEqual([
      expect.objectContaining({
        id: 'entry-note-hint',
        field: 'note',
        message: 'Note is almost full: 10 characters left.'
      })
    ]);
  });

  it('guides mood, energy, and focus when selection values are unset or invalid', () => {
    expect(
      getEntryValidationHints({
        date: '2026-05-21',
        mood: '',
        energy: '',
        focus: '6',
        note: ''
      })
    ).toEqual([
      expect.objectContaining({
        id: 'entry-mood-hint',
        field: 'mood',
        message: 'Choose a mood before saving.'
      }),
      expect.objectContaining({
        id: 'entry-energy-hint',
        field: 'energy',
        message: 'Choose energy from 1 to 5.'
      }),
      expect.objectContaining({
        id: 'entry-focus-hint',
        field: 'focus',
        message: 'Choose focus from 1 to 5.'
      })
    ]);
  });
});
