# Mood Mosaic

[English](README.md) | [简体中文](README-zh.md) | [日本語](README-ja.md)

Mood Mosaic is a local-first mood, energy, and focus journal for students, makers,
remote workers, and facilitators who want private reflection without accounts or
cloud sync.

## Problem

Many mood apps depend on accounts, cloud storage, or diagnosis-oriented language.
Habit trackers can feel too numeric for reflective notes, while spreadsheets are
awkward for quick daily context. Mood Mosaic keeps the data in your browser and
turns small daily entries into a readable calendar mosaic and short summary.

## Features

- Add or update one entry per selected date with mood, energy, focus, and a short note.
- See a sorted color mosaic, averages, mood counts, and streaks for all time,
  the selected Monday-Sunday week, or the selected calendar month.
- Review recent entries in a compact keyboard-friendly list and jump straight into editing.
- Use date shortcuts in the entry form: `T` for today, `[` for the previous saved date,
  and `]` for the next saved date.
- Copy a concise reflection summary for a journal, coach, or check-in.
- Export JSON backups with first-time guidance and preview imports before replacing browser data.
- Validate entries and imports without crashing on invalid or legacy data.
- Run fully client-side after a production build.

## Install From Source

Mood Mosaic is not published to a package registry. Use a source checkout:

```bash
git clone https://github.com/codecat-ai/mood-mosaic.git
cd mood-mosaic
npm ci
```

## Quick Start

```bash
npm run dev
```

Open the local URL printed by Vite. Pick today's date or an older entry date,
add mood, energy, focus, and note details, then use the mosaic and summary
panels to review patterns. The Trend range control filters the snapshot,
mosaic, recent entries, and copied summary to all time, the Monday-Sunday week
containing the selected entry date, or the selected calendar month. Use the
Recent entries list to load a recent day back into the form without using the
date picker. Keyboard users can press `T` to jump to today, `[` to move to the
previous saved date, and `]` to move to the next saved date when they are not
typing in a field.

## Examples

Example entry:

```json
{
  "date": "2026-05-21",
  "mood": "focused",
  "energy": 4,
  "focus": 5,
  "note": "Finished the project draft",
  "schemaVersion": 1
}
```

Example backup:

```json
{
  "schemaVersion": 1,
  "entries": []
}
```

Example review flow: save several days, pick This week or This month in Trend
range, tab to Recent entries, then use an Edit button or the `[` and `]`
shortcuts to load a date's mood, energy, focus, and note into the form.

## Configuration

There is no account, server, or cloud configuration. Data is stored in browser
LocalStorage under `mood-mosaic:journal`. Export JSON regularly if you want a
portable backup or need to move browsers. When there are no saved entries, the
backup panel explains that an export is not meaningful until an entry is saved.
Imports show concise restore guidance and a preview first with the accepted
entry count, date range, issues, and replacement/addition counts before you
confirm the browser data replacement.

## Development

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

The core model lives in `src/journal.ts`, recent-entry selection in
`src/recentEntries.ts`, import preview logic in `src/importPreview.ts`,
analytics and trend filtering in `src/summary.ts`, storage in `src/storage.ts`,
and the React UI in `src/App.tsx`.

## Testing

Tests cover validation and upsert behavior, recent-entry sorting and limits,
analytics and mosaic sorting, storage import/export handling, import previews,
legacy schema normalization, date-based editing, trend filtering, and UI smoke
flows. Write tests before changing behavior. Date shortcut behavior is covered
by pure helper tests plus a UI status update test.

## Roadmap

See [ROADMAP.md](ROADMAP.md). The launch state is active development with
small, local-first improvements prioritized over sync or medical features.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions should preserve the
local-first privacy model and avoid diagnosis, crisis guidance, tracking, or
package-registry installation claims.

## License

MIT. See [LICENSE](LICENSE).

## AI-Assisted Maintenance

This project may use AI tools for maintenance, review, and documentation drafts.
Maintainers remain responsible for validating changes, tests, licensing, and
project direction.
