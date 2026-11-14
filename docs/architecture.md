# Architecture foundation

These are options informed by the reference game `ttristan/game`; they are not claims that Glow already implements them.

## Reference lessons

- **Authority boundary:** browser clients render state and send inputs. Server validates gameplay and owns outcomes, persistence, and shared-world changes.
- **One gameplay protocol:** browser and headless agent CLI use same server protocol. CLI sends structured actions, reads authoritative updates, and records traces; decision-making stays separate from action execution.
- **Generated world persistence:** deterministic terrain can be regenerated from a seed, while database stores player state and world mutations such as mining and ownership. This avoids persisting an entire generated map.
- **Isolated verification:** disposable test worlds keep gameplay checks from changing development data. CLI traces and replays make agent actions inspectable without using browser automation as the gameplay interface.
- **Clear sources of truth:** server owns gameplay config and protocol shapes; database schema and migrations define persisted state. Clients consume server state rather than duplicating rules.

Reference reviewed: `ttristan/game` on 2026-11-14. Its TypeScript/PixiJS client, WebSocket server, PostgreSQL/Prisma storage, npm workspaces, Compose setup, and Agent CLI are examples, not Glow decisions.

## Glow today

Glow uses npm workspaces and contains a small TypeScript CLI plus a local PostgreSQL service. CLI currently checks an HTTP health endpoint only. Compose starts PostgreSQL only. The isolated Tidelight browser prototype (`npm run prototype`) explores gathering, planting, lanterns, upgrades, and changing tides with local-storage persistence. It is client-authoritative and does not establish the production architecture. There is no game server, schema, migration, shared gameplay protocol, or CLI/database connection.

The local Compose credentials are disposable development defaults, never production secrets. Keep proposed architecture distinct from implemented behavior as Glow evolves.

## Options for Glow

Once gameplay exists, a server-authoritative protocol shared by browser and headless CLI would support gameplay verification without a browser or privileged database access. If terrain is generated, deterministic generation plus persisted mutations may suit the world model. A disposable test database would protect development state. Choose these based on game design; Prisma, PixiJS, protocol messages, and gameplay rules remain undecided.
