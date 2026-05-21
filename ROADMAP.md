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

## Next

- Add a small import dry-run example to the backup panel so first-time users can
  understand replacement counts before pasting their own data.
- Add a clear unsaved-form reset action for returning the selected date to its
  last saved entry values.

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
- Show lightweight validation hints near the entry form for invalid selected
  dates, unset mood values, unset or out-of-range energy/focus values, and notes
  that are close to the saved-entry length limit before save attempts fail.
- Choose an optional reflection prompt near the note field, display the prompt
  text, and append it as a note starter without replacing existing note text.
