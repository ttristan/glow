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

The CLI's `health [URL]` command checks an HTTP server, defaulting to `http://127.0.0.1:8787/health`; it returns a nonzero status on failure. Glow has no server yet, so the default health check will fail until a compatible server is running. No server-backed gameplay or end-to-end stack is implemented yet.

CLI health runs save a timestamped replay artifact. Use `npm run --silent cli -- replay FILE` to open its local viewer; see the [CLI artifact workflow](docs/workflows/cli-artifacts.md) for capture and storage details.

## Tidelight prototype

Run `npm run prototype` and open http://127.0.0.1:8791. No dependencies or database are needed for the prototype; Node.js serves the browser files. `PORT` overrides the default port.

1. Click reachable land or use WASD/arrows to wander. Press E to gather nearby glow groves and stone; resources regrow.
2. Press 1 on empty grass to plant a grove; press 2 to build a lantern. Lanterns double nearby grove growth. Upgrade the gathering lens to increase reach and glow yield.
3. The tide changes every 45 active seconds. Shallows open at low tide; rising water returns stranded players to the meadow. Pause freezes growth and tides.
4. Progress saves in browser local storage. “New beginning” resets after confirmation. This finite, single-player island is a design experiment, without a game server, multiplayer, or database integration.

Screenshots: [arrival](prototypes/tidelight/screenshots/01-arrival.png), [making a mark](prototypes/tidelight/screenshots/02-growing.png), [high tide](prototypes/tidelight/screenshots/03-tide.png).
