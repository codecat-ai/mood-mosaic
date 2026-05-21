import { isValidEntryDate, normalizeNote, type JournalEntry } from './journal';

export interface MosaicCell {
  date: string;
  mood: string;
  energy: number;
  focus: number;
  color: string;
  label: string;
}

export interface JournalSummary {
  totalEntries: number;
  averageEnergy: number;
  averageFocus: number;
  moodCounts: Record<string, number>;
  currentStreakDays: number;
  recentNotes: string[];
}

export type TrendFilterMode = 'all' | 'week' | 'month';

export interface TrendFilterResult {
  mode: TrendFilterMode;
  anchorDate: string | null;
  entries: JournalEntry[];
  label: string;
  countLabel: string;
}

export function buildMosaicCells(entries: readonly JournalEntry[]): MosaicCell[] {
  return [...entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((entry) => ({
      date: entry.date,
      mood: entry.mood,
      energy: entry.energy,
      focus: entry.focus,
      color: moodColor(entry.mood),
      label: `${entry.date}: ${entry.mood}, energy ${entry.energy}, focus ${entry.focus}`
    }));
}

export function filterEntriesByTrend(
  entries: readonly JournalEntry[],
  mode: TrendFilterMode,
  anchorDate: string
): TrendFilterResult {
  const sorted = sortEntriesByDate(entries);

  if (mode === 'all' || !isValidEntryDate(anchorDate)) {
    return trendResult('all', null, sorted, 'All time');
  }

  if (mode === 'month') {
    const monthKey = anchorDate.slice(0, 7);
    const filtered = sorted.filter((entry) => entry.date.startsWith(monthKey));

    return trendResult(mode, anchorDate, filtered, `This month: ${formatMonthLabel(anchorDate)}`);
  }

  const { start, end } = weekWindow(anchorDate);
  const filtered = sorted.filter((entry) => entry.date >= start && entry.date <= end);

  return trendResult(mode, anchorDate, filtered, `This week: ${start} to ${end}`);
}

export function buildSummary(entries: readonly JournalEntry[]): JournalSummary {
  const sorted = sortEntriesByDate(entries);
  const totalEntries = sorted.length;
  const energySum = sorted.reduce((sum, entry) => sum + entry.energy, 0);
  const focusSum = sorted.reduce((sum, entry) => sum + entry.focus, 0);
  const moodCounts = sorted.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.mood] = (counts[entry.mood] ?? 0) + 1;
    return counts;
  }, {});
  const recentNotes = [...sorted]
    .reverse()
    .map((entry) => normalizeSummaryNote(entry.note))
    .filter((note) => note.length > 0)
    .slice(0, 3);

  return {
    totalEntries,
    averageEnergy: round(totalEntries === 0 ? 0 : energySum / totalEntries),
    averageFocus: round(totalEntries === 0 ? 0 : focusSum / totalEntries),
    moodCounts,
    currentStreakDays: calculateRecentStreak(sorted),
    recentNotes
  };
}

export function createCopySummary(entries: readonly JournalEntry[]): string {
  const summary = buildSummary(entries);
  const topMoods = Object.entries(summary.moodCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([mood, count]) => `${mood} (${count})`)
    .join(', ');
  const notes =
    summary.recentNotes.length > 0
      ? summary.recentNotes.map((note) => `- ${clamp(note, 120)}`).join('\n')
      : '- No recent notes';

  return [
    'Mood Mosaic summary',
    `${summary.totalEntries} entries, ${summary.currentStreakDays} day streak`,
    `Average energy ${summary.averageEnergy}/5, focus ${summary.averageFocus}/5`,
    `Top moods: ${topMoods || 'none yet'}`,
    'Recent notes:',
    notes
  ].join('\n');
}

function normalizeSummaryNote(value: string): string {
  const note = normalizeNote(value, 180);
  const lower = note.toLowerCase();

  if (!note || lower === '&lt;blank&gt;' || lower === 'undefined' || lower === 'null') {
    return '';
  }

  return note;
}

function calculateRecentStreak(sortedEntries: JournalEntry[]): number {
  if (sortedEntries.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(new Set(sortedEntries.map((entry) => entry.date))).sort().reverse();
  let streak = 1;
  let previous = parseIsoDate(uniqueDates[0]);

  for (const date of uniqueDates.slice(1)) {
    const current = parseIsoDate(date);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / 86_400_000);

    if (diffDays !== 1) {
      break;
    }

    streak += 1;
    previous = current;
  }

  return streak;
}

function trendResult(
  mode: TrendFilterMode,
  anchorDate: string | null,
  entries: JournalEntry[],
  label: string
): TrendFilterResult {
  return {
    mode,
    anchorDate,
    entries,
    label,
    countLabel: entries.length === 0 ? 'No entries' : `${entries.length} ${entryLabel(entries.length)}`
  };
}

function sortEntriesByDate(entries: readonly JournalEntry[]): JournalEntry[] {
  return [...entries].sort((left, right) => left.date.localeCompare(right.date));
}

function weekWindow(anchorDate: string): { start: string; end: string } {
  const date = parseIsoDate(anchorDate);
  const day = date.getUTCDay();
  const daysAfterMonday = day === 0 ? 6 : day - 1;
  const start = addDays(date, -daysAfterMonday);
  const end = addDays(start, 6);

  return {
    start: formatIsoDate(start),
    end: formatIsoDate(end)
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(date.getUTCDate() + days);
  return next;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMonthLabel(anchorDate: string): string {
  const [year, month] = anchorDate.split('-').map(Number);
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  return `${monthNames[month - 1]} ${year}`;
}

function entryLabel(count: number): string {
  return count === 1 ? 'entry' : 'entries';
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function moodColor(mood: string): string {
  let hash = 0;
  for (const char of mood.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }

  return hslToHex(hash, 62, 48);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];

  return `#${toHex(r + m)}${toHex(g + m)}${toHex(b + m)}`;
}

function toHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}
