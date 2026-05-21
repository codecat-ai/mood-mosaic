import { validateEntry, type JournalEntry } from './journal';

export const DEFAULT_RECENT_ENTRY_LIMIT = 5;

export function getRecentEntries(
  entries: readonly JournalEntry[],
  limit = DEFAULT_RECENT_ENTRY_LIMIT
): JournalEntry[] {
  const safeLimit = clampLimit(limit);

  if (safeLimit === 0) {
    return [];
  }

  return entries
    .map((entry) => validateEntry(entry))
    .filter((result): result is { ok: true; entry: JournalEntry } => result.ok)
    .map((result) => ({ ...result.entry }))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, safeLimit);
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.floor(limit);
}
