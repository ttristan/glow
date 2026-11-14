#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

export type CliEventSink = (kind: string, data: Record<string, unknown>) => void;

const help = `Glow CLI\n\nUsage:\n  npm run --silent cli -- --help\n  npm run --silent cli -- health [URL]\n  npm run --silent cli -- replay FILE\n\nChecks a game server's HTTP health endpoint (default http://127.0.0.1:8787/health), or opens a local replay viewer.\n`;

export async function main(
  args: string[],
  output: Pick<Console, 'log' | 'error'> = console,
  record: CliEventSink = () => {},
): Promise<number> {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    output.log(help);
    return 0;
  }
  if (args[0] === 'replay' && args.length === 2) {
    try {
      const { serveReplay } = await import('./replay-server.js');
      const url = await serveReplay(args[1]!);
      output.log(`Replay viewer: ${url}`);
      return 0;
    } catch (error) {
      output.error(`Could not open replay: ${error instanceof Error ? error.message : String(error)}`);
      return 1;
    }
  }
  if (args[0] !== 'health' || args.length > 2) {
    output.error(help);
    return 2;
  }
  try {
    const endpoint = new URL(args[1] ?? 'http://127.0.0.1:8787/health');
    record('action', { action: { command: 'health', url: `${endpoint.protocol}//${endpoint.host}${endpoint.pathname}` } });
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    record('server', { type: 'health.response', status: response.status, ok: response.ok });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    output.log(JSON.stringify({ ok: true, status: response.status }));
    return 0;
  } catch (error) {
    record('server', { type: 'health.error', errorType: error instanceof Error ? error.name : 'UnknownError' });
    output.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { CliRunRecorder } = await import('./run-artifacts.js');
  const recorder = new CliRunRecorder();
  process.exitCode = await main(process.argv.slice(2), console, (kind, data) => recorder.record(kind, data));
  try {
    const replayPath = await recorder.writeReplay();
    if (replayPath) console.error(`Replay: ${replayPath}`);
  } catch (error) {
    console.error(`Could not write CLI replay: ${error instanceof Error ? error.message : String(error)}`);
    if (process.exitCode === 0) process.exitCode = 1;
  }
}
