import { validateEntry, type JournalEntry } from './journal';

export const DEFAULT_RECENT_ENTRY_LIMIT = 5;

export function getRecentEntries(
  entries: readonly JournalEntry[],
  limit = DEFAULT_RECENT_ENTRY_LIMIT,
  searchQuery = ''
): JournalEntry[] {
  const safeLimit = clampLimit(limit);

  if (safeLimit === 0) {
    return [];
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return entries
    .map((entry) => validateEntry(entry))
    .filter((result): result is { ok: true; entry: JournalEntry } => result.ok)
    .map((result) => ({ ...result.entry }))
    .filter((entry) => matchesRecentEntrySearch(entry, normalizedQuery))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, safeLimit);
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.floor(limit);
}

function matchesRecentEntrySearch(entry: JournalEntry, normalizedQuery: string): boolean {
  if (normalizedQuery.length === 0) {
    return true;
  }

  return [entry.date, entry.mood, entry.note].some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  );
}
