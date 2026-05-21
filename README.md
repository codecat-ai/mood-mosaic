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
- See a sorted color mosaic, weekly-style averages, mood counts, and streaks.
- Copy a concise reflection summary for a journal, coach, or check-in.
- Export and import JSON backups from the browser.
- Validate entries and imports without crashing on invalid or legacy data.
- Run fully client-side after a production build.

## Install From Source

Mood Mosaic is not published to a package registry. Use a source checkout:

```bash
git clone <repository-url>
cd mood-mosaic
npm ci
```

## Quick Start

```bash
npm run dev
```

Open the local URL printed by Vite. Pick today's date or an older entry date,
add mood, energy, focus, and note details, then use the mosaic and summary
panels to review recent patterns.

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

## Configuration

There is no account, server, or cloud configuration. Data is stored in browser
LocalStorage under `mood-mosaic:journal`. Export JSON regularly if you want a
portable backup or need to move browsers.

## Development

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

The core model lives in `src/journal.ts`, analytics in `src/summary.ts`, storage
in `src/storage.ts`, and the React UI in `src/App.tsx`.

## Testing

Tests cover validation and upsert behavior, analytics and mosaic sorting,
storage import/export handling, legacy schema normalization, date-based editing,
and UI smoke flows. Write tests before changing behavior.

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
