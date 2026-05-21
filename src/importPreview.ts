import { normalizeEntries, type JournalEntry } from './journal';

export interface ImportDateRange {
  start: string;
  end: string;
}

export interface ImportPreview {
  canProceed: boolean;
  acceptedEntries: JournalEntry[];
  acceptedEntryCount: number;
  issues: string[];
  dateRange: ImportDateRange | null;
  replaceCount: number;
  addCount: number;
  summary: string;
}

export function previewJournalImport(
  source: string,
  currentEntries: readonly JournalEntry[]
): ImportPreview {
  const parsed = parseImportSource(source);

  if (!parsed.ok) {
    return emptyPreview(parsed.issues);
  }

  const normalized = normalizeEntries(parsed.entriesSource);
  const acceptedEntries = normalized.entries;
  const acceptedDates = acceptedEntries.map((entry) => entry.date);
  const currentDates = new Set(currentEntries.map((entry) => entry.date));
  const replaceCount = acceptedDates.filter((date) => currentDates.has(date)).length;
  const addCount = acceptedEntries.length - replaceCount;
  const dateRange =
    acceptedEntries.length > 0
      ? { start: acceptedEntries[0].date, end: acceptedEntries[acceptedEntries.length - 1].date }
      : null;

  return {
    canProceed: acceptedEntries.length > 0,
    acceptedEntries,
    acceptedEntryCount: acceptedEntries.length,
    issues: normalized.issues,
    dateRange,
    replaceCount,
    addCount,
    summary: buildSummary(acceptedEntries.length, dateRange, replaceCount, addCount, normalized.issues)
  };
}

type ParseResult =
  | { ok: true; entriesSource: unknown[] }
  | { ok: false; issues: string[] };

function parseImportSource(source: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, issues: ['Import must be valid JSON.'] };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    return { ok: false, issues: ['Import must be a JSON object with an entries array.'] };
  }

  return { ok: true, entriesSource: parsed.entries };
}

function emptyPreview(issues: string[]): ImportPreview {
  return {
    canProceed: false,
    acceptedEntries: [],
    acceptedEntryCount: 0,
    issues,
    dateRange: null,
    replaceCount: 0,
    addCount: 0,
    summary: `Import cannot proceed. ${issues.join(' ')}`
  };
}

function buildSummary(
  acceptedEntryCount: number,
  dateRange: ImportDateRange | null,
  replaceCount: number,
  addCount: number,
  issues: readonly string[]
): string {
  if (!dateRange || acceptedEntryCount === 0) {
    const issueText = issues.length > 0 ? ` ${issues.join(' ')}` : '';
    return `Import cannot proceed.${issueText}`;
  }

  const entryText = pluralize(acceptedEntryCount, 'entry', 'entries');
  const replaceText = `${replaceCount} existing ${pluralizeLabel(replaceCount, 'date', 'dates')} will be replaced`;
  const addText = `${addCount} new ${pluralizeLabel(addCount, 'date', 'dates')} will be added`;

  return `Ready to import ${entryText} from ${dateRange.start} to ${dateRange.end}. ${replaceText} and ${addText}.`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function pluralizeLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
