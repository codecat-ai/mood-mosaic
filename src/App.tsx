import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  resolveDateShortcut,
  resolveShortcutDate,
  type DateShortcutAction
} from './dateShortcuts';
import {
  CURRENT_SCHEMA_VERSION,
  isValidEntryDate,
  upsertEntry,
  validateEntry,
  type JournalEntry
} from './journal';
import { previewJournalImport, type ImportPreview } from './importPreview';
import { getRecentEntries } from './recentEntries';
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
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState<FormState>(() => formFromEntry(initial.entries, today));
  const [importSource, setImportSource] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [exportSource, setExportSource] = useState('');
  const [status, setStatus] = useState(
    initial.issues.length > 0 ? `Loaded with issues: ${initial.issues.join(' ')}` : 'Ready'
  );

  const summary = buildSummary(entries);
  const cells = buildMosaicCells(entries);
  const copySummary = createCopySummary(entries);
  const recentEntries = getRecentEntries(entries);

  const selectEntryDate = useCallback(
    (date: string, nextStatus?: string) => {
      setSelectedDate(date);

      if (!isValidEntryDate(date)) {
        setStatus('Choose a valid date before saving this entry.');
        return;
      }

      setForm(formFromEntry(entries, date));
      setStatus(
        nextStatus ??
          (entryForDate(entries, date) ? `Loaded entry for ${date}.` : `Editing entry for ${date}.`)
      );
    },
    [entries]
  );

  useEffect(() => {
    function handleDateShortcut(event: KeyboardEvent) {
      const action = resolveDateShortcut({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        target: shortcutTargetFromEvent(event.target)
      });

      if (!action) {
        return;
      }

      const nextDate = resolveShortcutDate(
        action,
        selectedDate,
        entries.map((entry) => entry.date),
        today
      );

      if (nextDate === selectedDate) {
        setStatus(noShortcutNeighborStatus(action));
        return;
      }

      event.preventDefault();
      selectEntryDate(nextDate, shortcutStatus(action, nextDate));
    }

    window.addEventListener('keydown', handleDateShortcut);
    return () => window.removeEventListener('keydown', handleDateShortcut);
  }, [entries, selectEntryDate, selectedDate, today]);

  function saveEntry() {
    if (!isValidEntryDate(selectedDate)) {
      setStatus('Choose a valid date before saving this entry.');
      return;
    }

    const result = validateEntry({
      date: selectedDate,
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
    setStatus(`Saved ${selectedDate}.`);
  }

  function exportJson() {
    const exported = storage.exportJson();
    setExportSource(exported);
    setStatus('Exported JSON backup.');
  }

  function previewImport() {
    const preview = previewJournalImport(importSource, entries);

    setImportPreview(preview);
    setStatus(preview.summary);
  }

  function confirmImport() {
    if (!importPreview?.canProceed) {
      setStatus('Preview a valid import before confirming.');
      return;
    }

    storage.save(importPreview.acceptedEntries);
    setEntries(importPreview.acceptedEntries);
    setForm(formFromEntry(importPreview.acceptedEntries, selectedDate));
    setImportPreview(null);
    setStatus(`Imported ${importPreview.acceptedEntryCount} entries.`);
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
          <h2>Entry</h2>
          <p className="date-chip" id="editing-date-status">
            {isValidEntryDate(selectedDate)
              ? `Editing entry for ${selectedDate}`
              : 'Choose a valid date to edit'}
          </p>

          <label>
            Entry date
            <input
              aria-describedby="editing-date-status"
              type="date"
              value={selectedDate}
              onChange={(event) => selectEntryDate(event.target.value)}
            />
          </label>

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
            {isValidEntryDate(selectedDate) ? `Save entry for ${selectedDate}` : 'Save entry'}
          </button>

          <aside className="shortcut-help" aria-label="Date keyboard shortcuts">
            <h3>Shortcuts</h3>
            <ul>
              <li>T: Today</li>
              <li>[: Previous saved date</li>
              <li>]: Next saved date</li>
            </ul>
          </aside>
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

          <section className="recent-entries" aria-labelledby="recent-entries-heading">
            <h2 id="recent-entries-heading">Recent entries</h2>
            {recentEntries.length === 0 ? (
              <p className="empty-state">Save an entry to review and edit recent days here.</p>
            ) : (
              <ul>
                {recentEntries.map((entry) => (
                  <li key={entry.date}>
                    <div>
                      <strong>{entry.date}</strong>
                      <span>{entry.mood}</span>
                      <span>
                        Energy {entry.energy}, Focus {entry.focus}
                      </span>
                      {entry.note ? <p>{previewNote(entry.note)}</p> : null}
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${entry.date}`}
                      onClick={() => selectEntryDate(entry.date)}
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
              onChange={(event) => {
                setImportSource(event.target.value);
                setImportPreview(null);
              }}
              placeholder='{"entries":[...]}'
              rows={8}
            />
          </label>
          <button type="button" onClick={previewImport}>
            Preview import
          </button>
          {importPreview ? (
            <div className="import-preview" aria-label="Import preview">
              <p>{importPreview.summary}</p>
              <dl>
                <div>
                  <dt>Accepted entries</dt>
                  <dd>{importPreview.acceptedEntryCount}</dd>
                </div>
                <div>
                  <dt>Date range</dt>
                  <dd>
                    {importPreview.dateRange
                      ? `${importPreview.dateRange.start} to ${importPreview.dateRange.end}`
                      : 'None'}
                  </dd>
                </div>
                <div>
                  <dt>Replacing</dt>
                  <dd>{importPreview.replaceCount}</dd>
                </div>
                <div>
                  <dt>New dates</dt>
                  <dd>{importPreview.addCount}</dd>
                </div>
              </dl>
              {importPreview.issues.length > 0 ? (
                <ul>
                  {importPreview.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              ) : null}
              {importPreview.canProceed ? (
                <button type="button" className="primary" onClick={confirmImport}>
                  Confirm import
                </button>
              ) : null}
            </div>
          ) : null}
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

function formFromEntry(entries: JournalEntry[], date: string): FormState {
  const existing = entryForDate(entries, date);

  return {
    mood: existing?.mood ?? MOODS[0],
    energy: String(existing?.energy ?? 3),
    focus: String(existing?.focus ?? 3),
    note: existing?.note ?? ''
  };
}

function entryForDate(entries: JournalEntry[], date: string): JournalEntry | undefined {
  return entries.find((entry) => entry.date === date);
}

function previewNote(note: string): string {
  return note.length > 96 ? `${note.slice(0, 93)}...` : note;
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function shortcutTargetFromEvent(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return {
    tagName: target.tagName,
    isContentEditable: target.isContentEditable
  };
}

function shortcutStatus(action: DateShortcutAction, date: string): string {
  if (action === 'today') {
    return `Shortcut moved to today, ${date}.`;
  }

  if (action === 'previous') {
    return `Shortcut moved to previous saved date, ${date}.`;
  }

  return `Shortcut moved to next saved date, ${date}.`;
}

function noShortcutNeighborStatus(action: DateShortcutAction): string {
  if (action === 'previous') {
    return 'No previous saved entry date.';
  }

  if (action === 'next') {
    return 'No next saved entry date.';
  }

  return 'Already editing today.';
}
