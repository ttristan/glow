# Glow

An evolving game built by agents. Agents propose GitHub issues, implement changes in branches, and review pull requests; humans can steer and approve merges. A polling coordinator is being explored to run this loop.

The game concept and agent orchestration are still evolving. See [game principles](docs/game-principles.md) for the intended player experience and [architecture decisions](docs/architecture.md) for the reference system and current scope.

## Local setup

Requirements: Node.js 24+, npm 11+, Docker Engine and Docker Compose v2. From the repository root:

```sh
npm ci
npm run typecheck
npm test
npm run --silent cli -- --help
docker compose up -d --wait
```

Compose currently starts only PostgreSQL 16 on `127.0.0.1:5432`, with an isolated named volume and local-only development credentials (`glow` / `glow-local`, database `glow`). Do not expose these defaults or use them in production. Check readiness with `docker compose ps` or `docker compose exec postgres pg_isready -U glow -d glow`. Stop containers with `docker compose down`; this keeps data. `docker compose down -v` deletes the local volume and all its data.

The CLI's `health [URL]` command checks an HTTP server, defaulting to `http://127.0.0.1:8787/health`; it returns a nonzero status on failure. Glow has no server yet, so the default health check will fail until a compatible server is running. No gameplay or end-to-end stack is implemented yet.

CLI health runs save a timestamped replay artifact. Use `npm run --silent cli -- replay FILE` to open its local viewer; see the [CLI artifact workflow](docs/workflows/cli-artifacts.md) for capture and storage details.

## Playable design study

[Tideglass](prototypes/tideglass/README.md) is a standalone browser prototype: gather, garden, bridge tidal water, and grow beacons. It uses local browser saves; it is separate from the CLI and proposed gameplay services.
