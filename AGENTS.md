# AGENTS.md

Glow is an evolving agent-built game. Current code is a TypeScript CLI; gameplay services are not implemented.

## Essentials

- npm workspaces; Node.js 24+, npm 11+; dependencies use exact versions.
- Typecheck: `npm run typecheck`; tests: `npm test`.
- Keep docs and summaries very concise; prefer numbered lists for easy reference.
- Modify any `AGENTS.md` or workflow file only with explicit user permission.
- Never merge PRs that modify any `AGENTS.md` or workflow file; only a human may merge them.

## Docs

- Architecture and current scope: `docs/architecture.md`
- Workflow index: `docs/workflows/README.md`
- Maintaining these instructions: `docs/changing-agents-md.md`
