# Roadmap

Mood Mosaic launches as an active-development project. The near-term goal is a
small, dependable local-first journal rather than a broad wellness platform.

## Maturity

Status: active development at launch.

The app is useful as a source-built browser tool, but the data model, UI polish,
and export format may still evolve with documented migration paths.

## Now

- Keep validation, import/export, and summary behavior covered by tests.
- Improve keyboard and screen-reader ergonomics as real feedback arrives.
- Refine visual density for students, makers, and remote work check-ins.

## Next

- Add optional date selection for editing older entries.
- Add import preview before replacing saved browser data.
- Add lightweight trend filters by week or month.

## Later

- Consider offline-first install metadata if the project has steady usage.
- Consider configurable mood labels while preserving JSON portability.
- Revisit localization of the app UI after the core workflow stabilizes.

## Maintenance Triggers

- Browser storage behavior changes.
- Dependency security advisories.
- Import/export schema changes.
- Accessibility regressions.
- Reports that copy summaries or notes leak unnormalized text.

## Cadence Review

Review activity and issue volume every three months. If changes slow and the
core workflow is stable, move from active development to maintenance mode.

## Completion Review

The project can be considered complete when local entry editing, pattern review,
backup/restore, documentation, and accessibility basics remain stable for at
least two cadence reviews without major feature requests.
