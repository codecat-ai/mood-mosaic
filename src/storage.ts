import {
  createJournalDocument,
  normalizeEntries,
  type JournalDocument,
  type JournalEntry
} from './journal';
import { previewJournalImport } from './importPreview';

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
      const current = this.load().entries;
      const preview = previewJournalImport(source, current);

      if (!preview.canProceed) {
        return { ok: false, issues: preview.issues };
      }

      this.save(preview.acceptedEntries);
      return { ok: true, entries: preview.acceptedEntries };
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

  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    return { entries: [], issues: ['Import must be a JSON object with an entries array.'] };
  }

  const normalized = normalizeEntries(parsed.entries);
  return { entries: normalized.entries, issues: normalized.issues };
}

function isRecord(value: unknown): value is Partial<JournalDocument> & Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
