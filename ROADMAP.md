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
- Support date-based entry editing for adding or revising older journal days.
- Maintain import previews before browser data replacement.
- Keep the compact recent-entry list accessible as review workflows evolve.
- Keep date keyboard shortcuts discoverable and aligned with form accessibility.
- Keep trend range filters understandable as summaries, mosaic cells, recent
  entries, and copied reflections share the same selected window.
- Keep first-time backup and restore guidance clear as import/export workflows
  evolve.
- Keep lightweight entry-form validation hints aligned with save validation and
  accessible field descriptions.
- Keep optional note prompts small, clear, and non-blocking for users who want
  more reflection structure.
- Keep the import dry-run example aligned with preview replacement and new-date
  counts as the import format evolves.
- Keep the unsaved-change indicator accurate as save, reset, date switching,
  and import workflows evolve.
- Keep recent-entry search clear and scoped to review so it does not change
  summaries, mosaic cells, copied reflections, or stored data.

## Next

- Add a small backup sanity-check view that summarizes pasted JSON before users
  run a full import preview, keeping restore decisions easier for longer local
  journals.

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

## Implemented Examples

- Select a date in the journal form, load an existing entry for that date, and
  save the edited mood, energy, focus, and note without changing other dates.
- Save entries for older or newer dates and keep summaries and mosaic cells
  sorted by date.
- Reject empty or invalid selected dates with status text before storage is
  changed.
- Review recent entries in newest-first order, including mood, energy, focus,
  and note previews, then use an Edit button to load that date into the form.
- Search recent entries by date, mood, or note within the selected trend window
  before the compact review limit is applied, without changing summary stats,
  mosaic cells, copied reflections, or stored browser data.
- Use visible keyboard shortcuts to jump to today or move to the previous or
  next saved entry date, with live status text after the selected date changes.
- Filter the journal snapshot, mosaic cells, recent entries, and copied
  reflection summary by all time, the Monday-Sunday week containing the selected
  date, or the selected calendar month.
- Preview a candidate import with accepted entry count, issues, date range,
  replacement count, and new-date count before any saved browser data changes.
- Show first-time backup guidance when there are no saved entries, switch to an
  export-ready entry count once data exists, and keep restore safety guidance
  associated with the import controls.
- Show a small import dry-run example in the backup and restore panel with a
  readable JSON payload, one existing-date replacement, one new date, and the
  same deterministic preview summary users will see before confirming imports.
- Show lightweight validation hints near the entry form for invalid selected
  dates, unset mood values, unset or out-of-range energy/focus values, and notes
  that are close to the saved-entry length limit before save attempts fail.
- Choose an optional reflection prompt near the note field, display the prompt
  text, and append it as a note starter without replacing existing note text.
- Reset unsaved form edits for the selected date back to its saved mood, energy,
  focus, and note, or back to default values when no entry exists, without
  mutating stored entries.
- Show a lightweight unsaved-change indicator when the current form differs
  from the selected date's saved entry or default values, and clear it after
  save or reset.
- Show compact generated and refreshed timestamps after exporting a backup or
  previewing a restore, without writing those timestamps into journal entries.
