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
- Search recent entries by date, mood, or note in a compact keyboard-friendly
  list and jump straight into editing.
- Use date shortcuts in the entry form: `T` for today, `[` for the previous saved date,
  and `]` for the next saved date.
- Reset unsaved form edits back to the selected date's saved entry, or to the
  default empty state when that date has no saved entry.
- See a lightweight unsaved-change indicator while the form differs from that
  date's saved entry or default state.
- See lightweight entry-form hints for invalid dates, missing ratings, and notes
  close to the saved-entry length limit before pressing Save.
- Choose an optional reflection prompt near the note field and append it as a
  starter without replacing existing note text.
- Copy a concise reflection summary for a journal, coach, or check-in.
- Export JSON backups with first-time guidance, a dry-run import example, and
  a pasted-JSON sanity check before previews replace browser data.
- See compact generated and refreshed timestamps after exporting a backup or
  previewing a restore.
- See a compact restore decision note before confirming whether a preview will
  replace existing dates, add new dates, or both.
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
panels to review patterns. Lightweight hints appear beside the form if the
selected date is invalid, a rating is outside 1-5, or the note is almost at the
saved-entry limit. An Unsaved changes indicator appears when the current form
differs from the selected date's saved entry or default values, then clears
after Save or Reset form. Use Reset form to discard unsaved edits for the
selected date; it reloads that date's saved values or clears back to defaults if
no entry exists, without changing stored entries. The optional Reflection prompt selector
can show a short mood, energy, focus, or next-step question, and its button
appends the prompt to the note instead of overwriting text already typed. The
Trend range control filters the snapshot, mosaic, recent entries, and copied
summary to all time, the Monday-Sunday week containing the selected entry date,
or the selected calendar month. Use Search recent entries to narrow only that
review list by date, mood, or note within the selected trend range, then load a
recent day back into the form without using the date picker. Keyboard users can
press `T` to jump to today, `[` to move to the previous saved date, and `]` to
move to the next saved date when they are not typing in a field.
When you paste backup JSON into the import box, a read-only Backup sanity check
summarizes JSON validity, schema version, raw entries, valid entries, issues,
and date range before you click Preview import. After previewing, a read-only
restore decision note near Confirm import states whether confirmation will
replace existing dates, add new dates, or both.

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

Example import dry run:

```json
{
  "schemaVersion": 1,
  "entries": [
    {
      "date": "2026-05-20",
      "mood": "steady",
      "energy": 4,
      "focus": 4,
      "note": "Dry-run replacement"
    },
    {
      "date": "2026-05-21",
      "mood": "bright",
      "energy": 5,
      "focus": 5,
      "note": "Dry-run new date"
    }
  ]
}
```

If an entry for `2026-05-20` already exists, the dry-run preview reports 2
accepted entries from `2026-05-20` to `2026-05-21`, with 1 existing date
replaced and 1 new date added.

Example review flow: save several days, pick This week or This month in Trend
range, tab to Search recent entries, type part of a date, mood, or note, then
use an Edit button or the `[` and `]` shortcuts to load a date's mood, energy,
focus, and note into the form.

Example backup/restore check: click Export JSON and confirm the backup panel
shows when that payload was generated, paste import JSON and review the Backup
sanity check, then preview an import and confirm the restore preview shows when
it was refreshed and whether confirming will replace existing dates, add new
dates, or both before any saved entries change.

## Configuration

There is no account, server, or cloud configuration. Data is stored in browser
LocalStorage under `mood-mosaic:journal`. Export JSON regularly if you want a
portable backup or need to move browsers. When there are no saved entries, the
backup panel explains that an export is not meaningful until an entry is saved.
After an export, the backup panel shows a compact generated timestamp for the
visible JSON payload. Imports show concise restore guidance and a preview first
with the accepted entry count, date range, issues, replacement/addition counts,
compact decision note, and refreshed timestamp before you confirm the browser
data replacement. The decision note spells out whether confirming will replace
existing dates, add new dates, or both. The import panel also includes a small
read-only dry-run JSON example so first-time users can see how replacement and
new-date counts work before pasting their own backup. After users paste their
own JSON, a read-only sanity check summarizes validity, schema version, raw and
valid entry counts, issues, and date range without saving data or replacing the
full preview flow.

## Development

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

The core model lives in `src/journal.ts`, entry hint logic in
`src/entryValidationHints.ts`, optional note prompt logic in
`src/notePrompts.ts`, deterministic form reset logic in `src/formReset.ts`,
recent-entry selection in `src/recentEntries.ts`, import preview logic in
`src/importPreview.ts`, backup sanity-check logic in `src/backupSanityCheck.ts`,
analytics and trend filtering in `src/summary.ts`, storage in `src/storage.ts`,
and the React UI in `src/App.tsx`.

## Testing

Tests cover validation and upsert behavior, entry hint behavior and
accessibility wiring, recent-entry sorting, limits, and search, analytics and
mosaic sorting, storage import/export handling, import previews, legacy schema
normalization, backup sanity checks, note prompt lookup and appending,
date-based editing, trend filtering, unsaved-form reset behavior,
unsaved-change detection, and UI smoke flows. Backup timestamp formatting is
covered by deterministic pure helper tests and injected-clock UI tests. Restore
decision notes are covered by pure helper tests and UI tests that confirm
previews do not mutate storage before confirmation. Write tests before changing
behavior. Date shortcut behavior is covered by pure helper tests plus a UI
status update test.

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
