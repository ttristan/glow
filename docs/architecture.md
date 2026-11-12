# Architecture foundation

These are decisions to evaluate for Glow, not claims that the game services already exist. The reference is [ttristan/game at c6fe6f8](https://github.com/ttristan/game/tree/c6fe6f804aaac3ea535226f73e00290baa3db806).

## Reference system

- The [browser client](https://github.com/ttristan/game/tree/c6fe6f804aaac3ea535226f73e00290baa3db806/apps/browser-game) uses TypeScript and PixiJS. It renders state and sends input over WebSocket.
- The [game server](https://github.com/ttristan/game/tree/c6fe6f804aaac3ea535226f73e00290baa3db806/apps/game-server) is authoritative for simulation and persistence. PostgreSQL stores player and world changes through Prisma. See the [architecture](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docs/architecture.md) and [database workflow](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docs/db-workflow.md).
- The [agent CLI](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docs/agent-cli.md) acts as a headless player using the same WebSocket protocol. It accepts structured commands, observes responses, and records traces. Its model-directed runner separates decisions from execution. This is a gameplay agent, distinct from the coding agent that changes the repository.
- [npm workspaces](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/package.json) group client, server, and CLI with shared root commands. [Compose](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docker-compose.yml) runs PostgreSQL, server, and client; its [development override](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docker-compose.override.yml) mounts source for hot reload. A [fast configuration](https://github.com/ttristan/game/blob/c6fe6f804aaac3ea535226f73e00290baa3db806/docker-compose.fast.yml) separates test ports and database storage.

## Adaptation for Glow

Start with the workspace layout, a local PostgreSQL service, and a small TypeScript CLI. Once gameplay exists, a server-authoritative protocol and a headless client on that same protocol would make agent behavior testable without a browser or privileged database access. A separate disposable test database would keep automated play from mutating development state. Prisma, PixiJS, actual protocol messages, gameplay, and the source CLI are not yet chosen or copied: they depend on the game design.

The CLI currently checks an HTTP health endpoint only; it cannot play a game. Compose starts only PostgreSQL; there is no Glow client, server, schema, migration, or connection between the CLI and database yet. These are follow-up decisions, not implemented services. The fixed database credentials in Compose are disposable local defaults, not production secrets.
