import { useMemo, useState, type CSSProperties } from 'react';
import { CURRENT_SCHEMA_VERSION, upsertEntry, validateEntry, type JournalEntry } from './journal';
import { buildMosaicCells, buildSummary, createCopySummary } from './summary';
import { createJournalStorage } from './storage';
import './styles.css';

const MOODS = ['calm', 'focused', 'bright', 'tired', 'stressed', 'reflective', 'steady'];

interface AppProps {
  storageTarget?: Storage;
  today?: string;
}

interface FormState {
  mood: string;
  energy: string;
  focus: string;
  note: string;
}

export default function App({ storageTarget, today = currentDate() }: AppProps) {
  const storage = useMemo(
    () => createJournalStorage(storageTarget ?? window.localStorage),
    [storageTarget]
  );
  const initial = useMemo(() => storage.load(), [storage]);
  const [entries, setEntries] = useState<JournalEntry[]>(initial.entries);
  const [form, setForm] = useState<FormState>(() => formFromEntry(initial.entries, today));
  const [importSource, setImportSource] = useState('');
  const [exportSource, setExportSource] = useState('');
  const [status, setStatus] = useState(
    initial.issues.length > 0 ? `Loaded with issues: ${initial.issues.join(' ')}` : 'Ready'
  );

  const summary = buildSummary(entries);
  const cells = buildMosaicCells(entries);
  const copySummary = createCopySummary(entries);

  function saveEntry() {
    const result = validateEntry({
      date: today,
      mood: form.mood,
      energy: Number(form.energy),
      focus: Number(form.focus),
      note: form.note,
      schemaVersion: CURRENT_SCHEMA_VERSION
    });

    if (!result.ok) {
      setStatus(result.issues.join(' '));
      return;
    }

    const nextEntries = upsertEntry(entries, result.entry);
    storage.save(nextEntries);
    setEntries(nextEntries);
    setStatus(`Saved ${today}.`);
  }

  function exportJson() {
    const exported = storage.exportJson();
    setExportSource(exported);
    setStatus('Exported JSON backup.');
  }

  function importJson() {
    const result = storage.importJson(importSource);

    if (!result.ok) {
      setStatus(`Import failed: ${result.issues.join(' ')}`);
      return;
    }

    setEntries(result.entries);
    setForm(formFromEntry(result.entries, today));
    setStatus(`Imported ${result.entries.length} entries.`);
  }

  async function copyReflectionSummary() {
    try {
      await navigator.clipboard?.writeText(copySummary);
      setStatus('Copied reflection summary.');
    } catch {
      setExportSource(copySummary);
      setStatus('Summary ready to copy from the export box.');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Local-first reflection journal</p>
          <h1>Mood Mosaic</h1>
          <p className="lede">
            Track mood, energy, focus, and short notes privately in this browser.
          </p>
        </div>
        <div className="hero-stats" aria-label="Journal snapshot">
          <span>{summary.totalEntries} entries</span>
          <span>{summary.currentStreakDays} day streak</span>
        </div>
      </section>

      <section className="workspace" aria-label="Mood journal workspace">
        <form className="entry-panel" onSubmit={(event) => event.preventDefault()}>
          <h2>Today</h2>
          <p className="date-chip">{today}</p>

          <label>
            Mood
            <select
              value={form.mood}
              onChange={(event) => setForm({ ...form, mood: event.target.value })}
            >
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </label>

          <div className="rating-grid">
            <label>
              Energy
              <input
                min="1"
                max="5"
                type="number"
                value={form.energy}
                onChange={(event) => setForm({ ...form, energy: event.target.value })}
              />
            </label>
            <label>
              Focus
              <input
                min="1"
                max="5"
                type="number"
                value={form.focus}
                onChange={(event) => setForm({ ...form, focus: event.target.value })}
              />
            </label>
          </div>

          <label>
            Note
            <textarea
              maxLength={480}
              rows={5}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="One useful detail about today"
            />
          </label>

          <button type="button" className="primary" onClick={saveEntry}>
            Save today
          </button>
        </form>

        <section className="mosaic-panel" aria-labelledby="mosaic-heading">
          <div className="panel-heading">
            <div>
              <h2 id="mosaic-heading">Mosaic</h2>
              <p>Recent pattern by date</p>
            </div>
            <button type="button" onClick={copyReflectionSummary}>
              Copy summary
            </button>
          </div>

          <div className="mosaic-grid" aria-label="Mood mosaic cells">
            {cells.length === 0 ? (
              <p className="empty-state">No entries yet.</p>
            ) : (
              cells.map((cell) => (
                <div
                  className="mosaic-cell"
                  key={cell.date}
                  style={{ '--cell-color': cell.color } as CSSProperties}
                  title={cell.label}
                >
                  <span>{cell.date.slice(5)}</span>
                  <strong>{cell.mood}</strong>
                </div>
              ))
            )}
          </div>

          <div className="summary-grid">
            <SummaryMetric label="Average energy" value={`${summary.averageEnergy}/5`} />
            <SummaryMetric label="Average focus" value={`${summary.averageFocus}/5`} />
            <SummaryMetric label="Streak" value={`${summary.currentStreakDays} days`} />
          </div>

          <div className="mood-counts" aria-label="Mood counts">
            {Object.entries(summary.moodCounts).map(([mood, count]) => (
              <span key={mood}>
                {mood}: {count}
              </span>
            ))}
          </div>
        </section>
      </section>

      <section className="backup-panel" aria-label="Backup and import">
        <div>
          <h2>Backup</h2>
          <div className="button-row">
            <button type="button" onClick={exportJson}>
              Export JSON
            </button>
          </div>
          <textarea
            aria-label="Exported JSON"
            readOnly
            value={exportSource}
            placeholder="Exported JSON appears here"
            rows={8}
          />
        </div>

        <div>
          <h2>Import</h2>
          <label>
            Import JSON
            <textarea
              value={importSource}
              onChange={(event) => setImportSource(event.target.value)}
              placeholder='{"entries":[...]}'
              rows={8}
            />
          </label>
          <button type="button" onClick={importJson}>
            Import
          </button>
        </div>
      </section>

      <p className="status" role="status" aria-live="polite">
        {status}
      </p>
    </main>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formFromEntry(entries: JournalEntry[], today: string): FormState {
  const existing = entries.find((entry) => entry.date === today);

  return {
    mood: existing?.mood ?? MOODS[0],
    energy: String(existing?.energy ?? 3),
    focus: String(existing?.focus ?? 3),
    note: existing?.note ?? ''
  };
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}
