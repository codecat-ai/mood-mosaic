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
import {
  getEntryValidationHints,
  type EntryValidationField,
  type EntryValidationHint
} from './entryValidationHints';
import {
  createResetFormState,
  hasUnsavedEntryFormChanges,
  type EntryFormState
} from './formReset';
import {
  IMPORT_DRY_RUN_EXAMPLE_JSON,
  createImportDryRunExamplePreview,
  previewJournalImport,
  type ImportPreview
} from './importPreview';
import {
  DEFAULT_REFLECTION_PROMPT_ID,
  REFLECTION_PROMPTS,
  createPromptNoteStarter,
  getReflectionPrompt
} from './notePrompts';
import { getRecentEntries } from './recentEntries';
import { formatBackupTimestamp } from './backupTimestamps';
import {
  buildMosaicCells,
  buildSummary,
  createCopySummary,
  filterEntriesByTrend,
  type TrendFilterMode
} from './summary';
import { createJournalStorage } from './storage';
import './styles.css';

const MOODS = ['calm', 'focused', 'bright', 'tired', 'stressed', 'reflective', 'steady'];

interface AppProps {
  storageTarget?: Storage;
  today?: string;
  now?: () => Date;
}

export default function App({
  storageTarget,
  today = currentDate(),
  now = () => new Date()
}: AppProps) {
  const storage = useMemo(
    () => createJournalStorage(storageTarget ?? window.localStorage),
    [storageTarget]
  );
  const initial = useMemo(() => storage.load(), [storage]);
  const [entries, setEntries] = useState<JournalEntry[]>(initial.entries);
  const [selectedDate, setSelectedDate] = useState(today);
  const [trendMode, setTrendMode] = useState<TrendFilterMode>('all');
  const [selectedPromptId, setSelectedPromptId] = useState(DEFAULT_REFLECTION_PROMPT_ID);
  const [form, setForm] = useState<EntryFormState>(() =>
    createResetFormState(initial.entries, today)
  );
  const [importSource, setImportSource] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importPreviewRefreshedAt, setImportPreviewRefreshedAt] = useState<string | null>(null);
  const [exportSource, setExportSource] = useState('');
  const [exportGeneratedAt, setExportGeneratedAt] = useState<string | null>(null);
  const [recentSearchQuery, setRecentSearchQuery] = useState('');
  const [status, setStatus] = useState(
    initial.issues.length > 0 ? `Loaded with issues: ${initial.issues.join(' ')}` : 'Ready'
  );

  const trend = filterEntriesByTrend(entries, trendMode, selectedDate);
  const trendEntries = trend.entries;
  const summary = buildSummary(trendEntries);
  const cells = buildMosaicCells(trendEntries);
  const copySummary = createCopySummary(trendEntries);
  const recentEntries = getRecentEntries(trendEntries, undefined, recentSearchQuery);
  const trimmedRecentSearchQuery = recentSearchQuery.trim();
  const selectedPrompt = getReflectionPrompt(selectedPromptId);
  const hasUnsavedChanges = hasUnsavedEntryFormChanges(form, entries, selectedDate);
  const backupGuidance =
    entries.length === 0
      ? 'Save an entry before exporting a meaningful JSON backup. Empty exports are only useful for checking the file shape.'
      : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} ready to export.`;
  const importGuidance =
    'Preview import safely before replacement. Browser data is not changed until you confirm.';
  const exportTimestampText = exportGeneratedAt
    ? `Generated ${formatBackupTimestamp(exportGeneratedAt)}.`
    : null;
  const importTimestampText = importPreviewRefreshedAt
    ? `Refreshed ${formatBackupTimestamp(importPreviewRefreshedAt)}.`
    : null;
  const importDryRunExample = useMemo(() => createImportDryRunExamplePreview(), []);
  const entryValidationHints = getEntryValidationHints({
    date: selectedDate,
    mood: form.mood,
    energy: form.energy,
    focus: form.focus,
    note: form.note
  });

  const selectEntryDate = useCallback(
    (date: string, nextStatus?: string) => {
      setSelectedDate(date);

      if (!isValidEntryDate(date)) {
        setStatus('Choose a valid date before saving this entry.');
        return;
      }

      setForm(createResetFormState(entries, date));
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

  function resetForm() {
    const hasSavedEntry = Boolean(entryForDate(entries, selectedDate));

    setForm(createResetFormState(entries, selectedDate));
    setStatus(
      hasSavedEntry
        ? `Reset form to the saved entry for ${selectedDate}.`
        : isValidEntryDate(selectedDate)
          ? `Reset form to defaults for ${selectedDate}.`
          : 'Reset form to defaults. Choose a valid date before saving.'
    );
  }

  function exportJson() {
    const exported = storage.exportJson();
    setExportSource(exported);
    setExportGeneratedAt(now().toISOString());
    setStatus('Exported JSON backup.');
  }

  function previewImport() {
    const preview = previewJournalImport(importSource, entries);

    setImportPreview(preview);
    setImportPreviewRefreshedAt(now().toISOString());
    setStatus(preview.summary);
  }

  function confirmImport() {
    if (!importPreview?.canProceed) {
      setStatus('Preview a valid import before confirming.');
      return;
    }

    storage.save(importPreview.acceptedEntries);
    setEntries(importPreview.acceptedEntries);
    setForm(createResetFormState(importPreview.acceptedEntries, selectedDate));
    setImportPreview(null);
    setImportPreviewRefreshedAt(null);
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

  function useSelectedPrompt() {
    const nextNote = createPromptNoteStarter(form.note, selectedPromptId);

    setForm({ ...form, note: nextNote });
    setStatus(
      form.note.trim().length > 0
        ? 'Added prompt to note without replacing existing text.'
        : 'Added prompt to note.'
    );
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
          {hasUnsavedChanges ? (
            <p aria-label="Unsaved changes" className="unsaved-indicator" role="status">
              Unsaved changes
            </p>
          ) : null}

          <label>
            Entry date
            <input
              aria-describedby={describedBy('date', entryValidationHints, 'editing-date-status')}
              type="date"
              value={selectedDate}
              onChange={(event) => selectEntryDate(event.target.value)}
            />
          </label>

          <label>
            Mood
            <select
              aria-describedby={describedBy('mood', entryValidationHints)}
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
                aria-describedby={describedBy('energy', entryValidationHints)}
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
                aria-describedby={describedBy('focus', entryValidationHints)}
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
              aria-describedby={describedBy('note', entryValidationHints)}
              maxLength={480}
              rows={5}
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="One useful detail about today"
            />
          </label>

          <div className="prompt-box">
            <label>
              Reflection prompt
              <select
                aria-describedby="reflection-prompt-help"
                value={selectedPromptId}
                onChange={(event) => setSelectedPromptId(event.target.value)}
              >
                {REFLECTION_PROMPTS.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.label}
                  </option>
                ))}
              </select>
            </label>
            <p id="reflection-prompt-help">
              Optional structure for your note. Choose a prompt if useful.
            </p>
            {selectedPrompt.text ? (
              <div className="selected-prompt" aria-live="polite">
                <p>{selectedPrompt.text}</p>
                <button type="button" onClick={useSelectedPrompt}>
                  Use prompt as note starter
                </button>
              </div>
            ) : null}
          </div>

          {entryValidationHints.length > 0 ? (
            <div
              aria-label="Entry validation hints"
              aria-live="polite"
              className="form-hints"
              role="status"
            >
              <ul>
                {entryValidationHints.map((hint) => (
                  <li id={hint.id} key={hint.id}>
                    {hint.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="form-actions">
            <button type="button" className="primary" onClick={saveEntry}>
              {isValidEntryDate(selectedDate) ? `Save entry for ${selectedDate}` : 'Save entry'}
            </button>
            <button type="button" aria-describedby="reset-form-help" onClick={resetForm}>
              Reset form
            </button>
          </div>
          <p className="form-help" id="reset-form-help">
            Restores the current form from saved data for this date, or defaults if none exists.
            Reset only changes the form.
          </p>

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
              <p>Trend anchored to selected entry date {selectedDate || 'none'}.</p>
            </div>
            <button type="button" onClick={copyReflectionSummary}>
              Copy summary
            </button>
          </div>

          <div className="trend-controls">
            <label>
              Trend range
              <select
                value={trendMode}
                onChange={(event) => setTrendMode(event.target.value as TrendFilterMode)}
              >
                <option value="all">All time</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </label>
            <p aria-live="polite">
              {trend.label} - {trendStatusCount(trend.countLabel)}
            </p>
          </div>

          <div className="mosaic-grid" aria-label="Mood mosaic cells">
            {cells.length === 0 ? (
              <p className="empty-state">{emptyTrendMessage(trend.mode)}</p>
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
            <label className="recent-search">
              Search recent entries
              <input
                type="search"
                value={recentSearchQuery}
                onChange={(event) => setRecentSearchQuery(event.target.value)}
                placeholder="Date, mood, or note"
              />
            </label>
            {recentEntries.length === 0 ? (
              <p className="empty-state">
                {emptyRecentMessage(trend.mode, trimmedRecentSearchQuery)}
              </p>
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
        <section aria-labelledby="backup-heading">
          <h2 id="backup-heading">Backup</h2>
          <p className="backup-guidance" id="backup-guidance">
            {backupGuidance}
          </p>
          <div className="button-row">
            <button type="button" onClick={exportJson}>
              Export JSON
            </button>
          </div>
          <textarea
            aria-label="Exported JSON"
            aria-describedby={
              exportTimestampText ? 'backup-guidance export-generated-at' : 'backup-guidance'
            }
            readOnly
            value={exportSource}
            placeholder="Exported JSON appears here"
            rows={8}
          />
          {exportTimestampText ? (
            <p className="backup-timestamp" id="export-generated-at" aria-live="polite">
              {exportTimestampText}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="import-heading">
          <h2 id="import-heading">Import</h2>
          <p className="backup-guidance" id="import-guidance">
            {importGuidance}
          </p>
          <section className="dry-run-example" aria-labelledby="dry-run-example-heading">
            <h3 id="dry-run-example-heading">Import dry-run example</h3>
            <p>
              Example dry run: pretend 2026-05-20 already exists, then preview this JSON to see
              one replacement and one new date before any browser data changes.
            </p>
            <textarea
              aria-label="Example dry-run JSON"
              readOnly
              value={IMPORT_DRY_RUN_EXAMPLE_JSON}
              rows={8}
            />
            <p>{importDryRunExample.summary}</p>
          </section>
          <label>
            Import JSON
            <textarea
              aria-describedby="import-guidance"
              value={importSource}
              onChange={(event) => {
                setImportSource(event.target.value);
                setImportPreview(null);
                setImportPreviewRefreshedAt(null);
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
              {importTimestampText ? (
                <p className="backup-timestamp" aria-live="polite">
                  {importTimestampText}
                </p>
              ) : null}
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
        </section>
      </section>

      <p aria-label="App status" className="status" role="status" aria-live="polite">
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

function describedBy(
  field: EntryValidationField,
  hints: EntryValidationHint[],
  baseId?: string
): string | undefined {
  const hint = hints.find((item) => item.field === field);
  const ids = [baseId, hint?.id].filter(Boolean);

  return ids.length > 0 ? ids.join(' ') : undefined;
}

function entryForDate(entries: JournalEntry[], date: string): JournalEntry | undefined {
  return entries.find((entry) => entry.date === date);
}

function previewNote(note: string): string {
  return note.length > 96 ? `${note.slice(0, 93)}...` : note;
}

function emptyTrendMessage(mode: TrendFilterMode): string {
  if (mode === 'week') {
    return 'No mosaic cells in this week window.';
  }

  if (mode === 'month') {
    return 'No mosaic cells in this month window.';
  }

  return 'No entries yet.';
}

function emptyRecentMessage(mode: TrendFilterMode, searchQuery = ''): string {
  if (searchQuery.length > 0) {
    return `No recent entries match "${searchQuery}".`;
  }

  if (mode === 'week') {
    return 'No entries in this week window.';
  }

  if (mode === 'month') {
    return 'No entries in this month window.';
  }

  return 'Save an entry to review and edit recent days here.';
}

function trendStatusCount(countLabel: string): string {
  if (countLabel === '1 entry') {
    return '1 matching entry';
  }

  if (countLabel.endsWith(' entries')) {
    return countLabel.replace(' entries', ' matching entries');
  }

  return countLabel;
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
