# Contributing

Thank you for considering a contribution to Mood Mosaic.

## Development

Use a source checkout:

```bash
git clone <repository-url>
cd mood-mosaic
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

## Project Boundaries

- Keep the app local-first with no required account, server, or cloud sync.
- Do not add diagnosis, treatment, crisis guidance, or medical claims.
- Do not add third-party tracking.
- Do not document package-registry install commands unless the project is
  actually published there.
- Keep user-visible import/export data portable JSON.

## Code Style

- Write tests before behavior changes.
- Keep TypeScript strict and prefer pure functions for model, analytics, and
  storage transformations.
- Use English code comments and commit messages.
- Keep dependencies modest and justified.

## Pull Requests

Describe the problem, the change, tests run, and any schema or accessibility
impact. Maintainers may ask for smaller changes if a pull request mixes feature
work with unrelated refactors.
