import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, type JournalEntry } from './journal';
import { createJournalStorage } from './storage';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  length = 0;

  clear(): void {
    this.data.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
    this.length = this.data.size;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
    this.length = this.data.size;
  }
}

describe('storage adapter', () => {
  it('loads missing storage as an empty journal', () => {
    const adapter = createJournalStorage(new MemoryStorage());

    expect(adapter.load()).toEqual({ entries: [], issues: [] });
  });

  it('normalizes legacy entries missing schemaVersion', () => {
    const target = new MemoryStorage();
    target.setItem(
      'mood-mosaic:journal',
      JSON.stringify({
        entries: [{ date: '2026-05-21', mood: 'calm', energy: 3, focus: 4, note: 'legacy' }]
      })
    );

    const adapter = createJournalStorage(target);
    const loaded = adapter.load();

    expect(loaded.issues).toEqual([]);
    expect(loaded.entries[0]?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('reports invalid import JSON and preserves existing entries', () => {
    const existing: JournalEntry[] = [
      {
        date: '2026-05-21',
        mood: 'calm',
        energy: 3,
        focus: 4,
        note: 'keep me',
        schemaVersion: CURRENT_SCHEMA_VERSION
      }
    ];
    const adapter = createJournalStorage(new MemoryStorage());
    adapter.save(existing);

    const result = adapter.importJson('{nope');

    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.issues[0]).toContain('valid JSON');
    }
    expect(adapter.load().entries).toEqual(existing);
  });

  it('exports escaped normalized JSON', () => {
    const adapter = createJournalStorage(new MemoryStorage());
    adapter.save([
      {
        date: '2026-05-21',
        mood: 'calm',
        energy: 3,
        focus: 4,
        note: 'A <tag>',
        schemaVersion: CURRENT_SCHEMA_VERSION
      }
    ]);

    expect(adapter.exportJson()).toContain('&lt;tag&gt;');
  });
});
