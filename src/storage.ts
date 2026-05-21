import {
  createJournalDocument,
  normalizeEntries,
  type JournalDocument,
  type JournalEntry
} from './journal';

export const STORAGE_KEY = 'mood-mosaic:journal';

export interface LoadResult {
  entries: JournalEntry[];
  issues: string[];
}

export type ImportResult = { ok: true; entries: JournalEntry[] } | { ok: false; issues: string[] };

export interface JournalStorage {
  load(): LoadResult;
  save(entries: readonly JournalEntry[]): void;
  exportJson(): string;
  importJson(source: string): ImportResult;
}

export function createJournalStorage(target: Storage, key = STORAGE_KEY): JournalStorage {
  return {
    load() {
      const stored = target.getItem(key);
      if (!stored) {
        return { entries: [], issues: [] };
      }

      return parseJournal(stored);
    },
    save(entries) {
      const document = createJournalDocument(entries);
      target.setItem(key, JSON.stringify(document));
    },
    exportJson() {
      const loaded = this.load();
      return JSON.stringify(createJournalDocument(loaded.entries), null, 2);
    },
    importJson(source) {
      const parsed = parseJournal(source);

      if (parsed.issues.length > 0) {
        return { ok: false, issues: parsed.issues };
      }

      this.save(parsed.entries);
      return { ok: true, entries: parsed.entries };
    }
  };
}

function parseJournal(source: string): LoadResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch {
    return { entries: [], issues: ['Import must be valid JSON.'] };
  }

  if (!isRecord(parsed)) {
    return { entries: [], issues: ['Import must be a JSON object.'] };
  }

  const entriesSource = Array.isArray(parsed.entries)
    ? parsed.entries
    : Array.isArray(parsed)
      ? parsed
      : undefined;

  if (!entriesSource) {
    return { entries: [], issues: ['Import must include an entries array.'] };
  }

  const normalized = normalizeEntries(entriesSource);
  return { entries: normalized.entries, issues: normalized.issues };
}

function isRecord(value: unknown): value is Partial<JournalDocument> & Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
