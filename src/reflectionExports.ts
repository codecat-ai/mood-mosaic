import { type JournalEntry } from './journal';
import { buildSummary } from './summary';

const DEFAULT_TITLE = 'Mood Mosaic Reflection';
const DEFAULT_NOTE_MAX_LENGTH = 180;

export interface ReflectionExportInput {
  title?: string;
  rangeLabel: string;
  generatedLabel?: string;
  entries: readonly JournalEntry[];
  noteMaxLength?: number;
}

export function createReflectionMarkdown(input: ReflectionExportInput): string {
  const snapshot = createSnapshot(input);
  const lines = [
    `# ${escapeMarkdown(snapshot.title)}`,
    '',
    snapshot.generatedLabel ? escapeMarkdown(snapshot.generatedLabel) : '',
    `Range: ${escapeMarkdown(snapshot.rangeLabel)}`,
    `Date range: ${escapeMarkdown(snapshot.dateRange)}`,
    `Entries: ${snapshot.count}`,
    `Mood mix: ${escapeMarkdown(snapshot.moodSummary)}`,
    `Average energy: ${snapshot.averageEnergy}/5`,
    `Average focus: ${snapshot.averageFocus}/5`,
    '',
    '## Entries',
    ''
  ].filter((line, index, all) => !(line === '' && all[index - 1] === ''));

  if (snapshot.entries.length === 0) {
    lines.push('- No entries in this export.');
  } else {
    for (const entry of snapshot.entries) {
      lines.push(
        `- ${escapeMarkdown(entry.date)} - ${escapeMarkdown(entry.mood)} - Energy ${entry.energy}/5 - Focus ${entry.focus}/5`
      );

      if (entry.note) {
        lines.push(`  Note: ${escapeMarkdown(entry.note)}`);
      }
    }
  }

  return lines.join('\n').trim();
}

export function createPrintableReflectionHtml(input: ReflectionExportInput): string {
  const snapshot = createSnapshot(input);
  const generated = snapshot.generatedLabel
    ? `<p class="generated">${escapeHtml(snapshot.generatedLabel)}</p>`
    : '';
  const entries =
    snapshot.entries.length === 0
      ? '<p class="empty">No entries in this export.</p>'
      : `<ol>${snapshot.entries
          .map(
            (entry) => `<li>
        <h2>${escapeHtml(entry.date)} - ${escapeHtml(entry.mood)}</h2>
        <p>Energy ${entry.energy}/5 - Focus ${entry.focus}/5</p>
        ${entry.note ? `<p class="note">${escapeHtml(entry.note)}</p>` : ''}
      </li>`
          )
          .join('')}</ol>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(snapshot.title)}</title>
    <style>
      body { color: #18221d; font-family: system-ui, sans-serif; line-height: 1.5; margin: 2rem; }
      h1 { margin-bottom: 0.25rem; }
      dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.35rem 1rem; }
      dt { font-weight: 700; }
      ol { padding-left: 1.25rem; }
      li { break-inside: avoid; margin-bottom: 1rem; }
      .generated, .note { color: #435047; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(snapshot.title)}</h1>
    ${generated}
    <dl>
      <dt>Range</dt><dd>${escapeHtml(snapshot.rangeLabel)}</dd>
      <dt>Date range</dt><dd>${escapeHtml(snapshot.dateRange)}</dd>
      <dt>Entries</dt><dd>${snapshot.count}</dd>
      <dt>Mood mix</dt><dd>${escapeHtml(snapshot.moodSummary)}</dd>
      <dt>Average energy</dt><dd>${snapshot.averageEnergy}/5</dd>
      <dt>Average focus</dt><dd>${snapshot.averageFocus}/5</dd>
    </dl>
    ${entries}
  </body>
</html>`;
}

interface ReflectionSnapshot {
  title: string;
  rangeLabel: string;
  generatedLabel: string;
  dateRange: string;
  count: number;
  moodSummary: string;
  averageEnergy: number;
  averageFocus: number;
  entries: ReflectionEntry[];
}

interface ReflectionEntry {
  date: string;
  mood: string;
  energy: number;
  focus: number;
  note: string;
}

function createSnapshot(input: ReflectionExportInput): ReflectionSnapshot {
  const noteMaxLength = Math.max(0, Math.floor(input.noteMaxLength ?? DEFAULT_NOTE_MAX_LENGTH));
  const entries = [...input.entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => ({
      date: cleanText(entry.date),
      mood: cleanText(entry.mood),
      energy: entry.energy,
      focus: entry.focus,
      note: truncate(cleanText(entry.note), noteMaxLength),
      schemaVersion: entry.schemaVersion
    }));
  const summary = buildSummary(entries);
  const firstDate = entries[0]?.date;
  const lastDate = entries.at(-1)?.date;

  return {
    title: cleanText(input.title || DEFAULT_TITLE),
    rangeLabel: cleanText(input.rangeLabel),
    generatedLabel: cleanText(input.generatedLabel || ''),
    dateRange: firstDate && lastDate ? `${firstDate} to ${lastDate}` : 'No entries',
    count: entries.length,
    moodSummary: formatMoodSummary(summary.moodCounts),
    averageEnergy: summary.averageEnergy,
    averageFocus: summary.averageFocus,
    entries
  };
}

function formatMoodSummary(moodCounts: Record<string, number>): string {
  const moods = Object.entries(moodCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([mood, count]) => `${mood} (${count})`);

  return moods.length > 0 ? moods.join(', ') : 'none';
}

function cleanText(value: string): string {
  const cleaned = decodeKnownEntities(value)
    .replace(/\s+/g, ' ')
    .trim();
  const lower = cleaned.toLowerCase();

  return lower === 'undefined' || lower === 'null' ? '' : cleaned;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 0) {
    return '';
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function escapeMarkdown(value: string): string {
  return escapeHtml(value).replace(/([\\`*_{}[\]()#+\-!|>])/g, '\\$1');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeKnownEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
