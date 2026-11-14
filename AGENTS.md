# AGENTS.md

Glow is an evolving agent-built game. Current code is a TypeScript CLI; gameplay services are not implemented.

## Essentials

- npm workspaces; Node.js 24+, npm 11+; dependencies use exact versions.
- Typecheck: `npm run typecheck`; tests: `npm test`.
- Keep docs and summaries very concise; prefer numbered lists for easy reference.
- Modify any `AGENTS.md` or workflow file only with explicit user permission.
- Never merge PRs that modify any `AGENTS.md` or workflow file; only a human may merge them.

## Docs

- Game principles: `docs/game-principles.md`
- Architecture and current scope: `docs/architecture.md`
- Workflow index: `docs/workflows/README.md`
- Maintaining these instructions: `docs/changing-agents-md.md`

Keep every doc referenced here, either directly or through its folder's README index. Update this list or the relevant index when adding, moving, or removing docs.
