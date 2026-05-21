export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_NOTE_LENGTH = 480;

export interface JournalEntry {
  date: string;
  mood: string;
  energy: number;
  focus: number;
  note: string;
  schemaVersion: number;
}

export type ValidationResult =
  | { ok: true; entry: JournalEntry }
  | { ok: false; issues: string[] };

export interface JournalDocument {
  schemaVersion: number;
  entries: JournalEntry[];
}

export function normalizeNote(value: unknown, maxLength = MAX_NOTE_LENGTH): string {
  const text = typeof value === 'string' ? value : '';
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

  return escapeText(normalized).slice(0, maxLength);
}

export function escapeText(value: string): string {
  return value
    .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validateEntry(raw: unknown): ValidationResult {
  const issues: string[] = [];

  if (!isRecord(raw)) {
    return { ok: false, issues: ['Entry must be an object.'] };
  }

  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const mood = typeof raw.mood === 'string' ? raw.mood.trim() : '';
  const energy = coerceRating(raw.energy);
  const focus = coerceRating(raw.focus);
  const rawNote = typeof raw.note === 'string' ? raw.note : '';
  const schemaVersion =
    typeof raw.schemaVersion === 'number' ? raw.schemaVersion : CURRENT_SCHEMA_VERSION;

  if (!isValidEntryDate(date)) {
    issues.push('Entry date must be a valid YYYY-MM-DD date.');
  }

  if (!mood) {
    issues.push('Entry mood cannot be empty.');
  }

  if (!isRating(energy)) {
    issues.push('Entry energy must be an integer from 1 to 5.');
  }

  if (!isRating(focus)) {
    issues.push('Entry focus must be an integer from 1 to 5.');
  }

  if (rawNote.trim().length > MAX_NOTE_LENGTH) {
    issues.push(`Entry note must be ${MAX_NOTE_LENGTH} characters or fewer.`);
  }

  if (schemaVersion > CURRENT_SCHEMA_VERSION || schemaVersion < 1) {
    issues.push('Entry schemaVersion is not supported.');
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    entry: {
      date,
      mood: escapeText(mood),
      energy,
      focus,
      note: normalizeNote(rawNote),
      schemaVersion: CURRENT_SCHEMA_VERSION
    }
  };
}

export function upsertEntry(entries: readonly JournalEntry[], entry: JournalEntry): JournalEntry[] {
  const normalized = validateEntry(entry);

  if (normalized.ok === false) {
    throw new Error(normalized.issues.join(' '));
  }

  const replaced = entries.map((item) =>
    item.date === normalized.entry.date ? { ...normalized.entry } : { ...item }
  );

  if (!entries.some((item) => item.date === normalized.entry.date)) {
    replaced.push({ ...normalized.entry });
  }

  return replaced.sort((left, right) => left.date.localeCompare(right.date));
}

export function normalizeEntries(rawEntries: unknown): { entries: JournalEntry[]; issues: string[] } {
  if (!Array.isArray(rawEntries)) {
    return { entries: [], issues: ['Journal entries must be an array.'] };
  }

  const issues: string[] = [];
  const entries = rawEntries.reduce<JournalEntry[]>((accepted, raw, index) => {
    const result = validateEntry(raw);
    if (result.ok === false) {
      issues.push(`Entry ${index + 1}: ${result.issues.join(' ')}`);
      return accepted;
    }

    return upsertEntry(accepted, result.entry);
  }, []);

  return { entries, issues };
}

export function createJournalDocument(entries: readonly JournalEntry[]): JournalDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    entries: normalizeEntries(entries).entries
  };
}

function coerceRating(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
}

function isRating(value: number): value is 1 | 2 | 3 | 4 | 5 {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function isValidEntryDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
