import type { JournalEntry } from './journal';

export interface EntryFormState {
  mood: string;
  energy: string;
  focus: string;
  note: string;
}

export const DEFAULT_ENTRY_FORM_STATE: EntryFormState = {
  mood: 'calm',
  energy: '3',
  focus: '3',
  note: ''
};

export function createResetFormState(entries: JournalEntry[], selectedDate: string): EntryFormState {
  const savedEntry = entries.find((entry) => entry.date === selectedDate);

  if (!savedEntry) {
    return { ...DEFAULT_ENTRY_FORM_STATE };
  }

  return {
    mood: savedEntry.mood,
    energy: String(savedEntry.energy),
    focus: String(savedEntry.focus),
    note: savedEntry.note
  };
}
