import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

export type ReplayEvent = {
  ms: number;
  kind: string;
  data: unknown;
};

/** Records CLI activity as a compact, ordered replay for later inspection. */
export class CliRunRecorder {
  readonly runId = randomUUID().slice(0, 8);
  readonly startedAt = new Date().toISOString();
  private readonly started = performance.now();
  private readonly events: ReplayEvent[] = [];
  private readonly artifactRoot: string;

  constructor(artifactRoot = defaultArtifactRoot()) { this.artifactRoot = artifactRoot; }

  record(kind: string, data: unknown): void {
    this.events.push({
      ms: performance.now() - this.started,
      kind,
      data,
    });
  }

  async writeReplay(): Promise<string | undefined> {
    if (!this.events.length) return undefined;

    const date = this.startedAt.slice(0, 10);
    const minute = this.startedAt.slice(11, 16).replace(':', '-');
    const directory = join(this.artifactRoot, date, minute, `run-${this.runId}`);
    const replayPath = join(directory, 'replay.json');
    await mkdir(directory, { recursive: true });
    await writeFile(replayPath, `${JSON.stringify({ events: this.events })}\n`);
    return replayPath;
  }
}

function defaultArtifactRoot(): string {
  const configured = process.env.GLOW_CLI_ARTIFACT_DIR?.trim();
  return resolve(configured || join(dirname(fileURLToPath(import.meta.url)), '../artifacts/cli'));
}
