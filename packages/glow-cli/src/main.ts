#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

const help = `Glow CLI\n\nUsage:\n  npm run --silent cli -- --help\n  npm run --silent cli -- health [URL]\n\nChecks a game server's HTTP health endpoint (default http://127.0.0.1:8787/health).\n`;

export async function main(args: string[], output: Pick<Console, 'log' | 'error'> = console): Promise<number> {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    output.log(help);
    return 0;
  }
  if (args[0] !== 'health' || args.length > 2) {
    output.error(help);
    return 2;
  }
  try {
    const response = await fetch(args[1] ?? 'http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    output.log(JSON.stringify({ ok: true, status: response.status }));
    return 0;
  } catch (error) {
    output.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
