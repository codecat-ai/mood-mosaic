import { isValidEntryDate, MAX_NOTE_LENGTH } from './journal';

export type EntryValidationField = 'date' | 'mood' | 'energy' | 'focus' | 'note';

export interface EntryValidationHint {
  id: string;
  field: EntryValidationField;
  message: string;
}

export interface EntryValidationHintInput {
  date: string;
  mood: string;
  energy: string;
  focus: string;
  note: string;
}

const NOTE_APPROACHING_LIMIT = 20;

export function getEntryValidationHints(input: EntryValidationHintInput): EntryValidationHint[] {
  const hints: EntryValidationHint[] = [];

  if (!isValidEntryDate(input.date)) {
    hints.push({
      id: 'entry-date-hint',
      field: 'date',
      message: 'Choose a real calendar date before saving.'
    });
  }

  if (input.mood.trim() === '') {
    hints.push({
      id: 'entry-mood-hint',
      field: 'mood',
      message: 'Choose a mood before saving.'
    });
  }

  if (!isRatingValue(input.energy)) {
    hints.push({
      id: 'entry-energy-hint',
      field: 'energy',
      message: 'Choose energy from 1 to 5.'
    });
  }

  if (!isRatingValue(input.focus)) {
    hints.push({
      id: 'entry-focus-hint',
      field: 'focus',
      message: 'Choose focus from 1 to 5.'
    });
  }

  const remainingNoteCharacters = MAX_NOTE_LENGTH - input.note.length;
  if (remainingNoteCharacters >= 0 && remainingNoteCharacters <= NOTE_APPROACHING_LIMIT) {
    hints.push({
      id: 'entry-note-hint',
      field: 'note',
      message: `Note is almost full: ${remainingNoteCharacters} characters left.`
    });
  }

  return hints;
}

function isRatingValue(value: string): boolean {
  const rating = Number(value);

  return value.trim() !== '' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
