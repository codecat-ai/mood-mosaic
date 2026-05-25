import {
  CURRENT_SCHEMA_VERSION,
  normalizeEntries,
  normalizeNote,
  type JournalEntry
} from './journal';

export interface DemoScreenshotChecklist {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  entryCount: number;
  recommendedUiStates: string[];
  notePreviews: string[];
  summary: string;
}

const DEMO_SCREENSHOT_TITLE = 'Mood Mosaic demo screenshot checklist';
const DEFAULT_PREVIEW_LENGTH = 72;

const RECOMMENDED_UI_STATES = Object.freeze([
  'All time summary with full mosaic visible',
  'This week trend range for 2026-05-21',
  'Recent entries search filtered by note text',
  'Backup panel showing export-ready guidance',
  'Import dry run preview before confirmation'
]);

const RAW_DEMO_JOURNAL_ENTRIES = [
  {
    date: '2026-05-18',
    mood: 'calm',
    energy: 3,
    focus: 4,
    note: 'Planning reset: protect focus blocks *before* chat.',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-19',
    mood: 'tired',
    energy: 2,
    focus: 2,
    note: 'Low battery, kept scope tiny; no secret sk-demo-secret-123456.',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-20',
    mood: 'steady',
    energy: 4,
    focus: 3,
    note: 'Pair review helped; captured <edge cases> & risks.',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-21',
    mood: 'focused',
    energy: 5,
    focus: 5,
    note: 'Deep work sprint, wrote docs with `stable fixtures`.',
    schemaVersion: CURRENT_SCHEMA_VERSION
  },
  {
    date: '2026-05-22',
    mood: 'bright',
    energy: 4,
    focus: 4,
    note: 'Retro notes: energy up, focus steady, ship checklist?',
    schemaVersion: CURRENT_SCHEMA_VERSION
  }
] satisfies JournalEntry[];

export const DEMO_JOURNAL_ENTRIES: readonly JournalEntry[] = Object.freeze(
  normalizeEntries(RAW_DEMO_JOURNAL_ENTRIES).entries.map((entry) => Object.freeze({ ...entry }))
);

export function createDemoEntries(): JournalEntry[] {
  return DEMO_JOURNAL_ENTRIES.map((entry) => ({ ...entry }));
}

export function buildDemoScreenshotChecklist(
  entries: readonly JournalEntry[] = DEMO_JOURNAL_ENTRIES
): DemoScreenshotChecklist {
  const normalizedEntries = normalizeEntries(entries).entries;
  const firstDate = normalizedEntries[0]?.date ?? '';
  const lastDate = normalizedEntries.at(-1)?.date ?? '';
  const recommendedUiStates = [...RECOMMENDED_UI_STATES];

  return {
    title: DEMO_SCREENSHOT_TITLE,
    dateRange: {
      start: firstDate,
      end: lastDate
    },
    entryCount: normalizedEntries.length,
    recommendedUiStates,
    notePreviews: normalizedEntries.map((entry) => createSafeNotePreview(entry.note)),
    summary: [
      `${DEMO_SCREENSHOT_TITLE}: ${normalizedEntries.length} entries from ${firstDate} to ${lastDate}.`,
      `Capture ${recommendedUiStates.join('; ')}.`
    ].join(' ')
  };
}

export function createSafeNotePreview(value: string, maxLength = DEFAULT_PREVIEW_LENGTH): string {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\s+/g, ' ').trim();
  const redacted = normalized
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted email]')
    .replace(/\b(?:sk|pk|ghp|gho|github_pat|api)[-_][A-Z0-9_-]{6,}\b/gi, '[redacted token]');
  const escaped = escapeMarkdownMarkers(normalizeNote(redacted, maxLength * 4));

  return clampPreview(escaped, maxLength);
}

function escapeMarkdownMarkers(value: string): string {
  return value.replace(/([\\`*_[\]])/g, '\\$1');
}

function clampPreview(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
