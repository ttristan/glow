import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

/** Serve one explicitly selected replay on loopback until the process exits. */
export async function serveReplay(path: string): Promise<string> {
  const content = await readFile(path, 'utf8');
  const replay: unknown = JSON.parse(content);
  if (!replay || typeof replay !== 'object' || !('events' in replay) || !Array.isArray(replay.events)) throw new Error('Invalid replay');
  let previous = 0;
  for (const event of replay.events) {
    if (!event || typeof event !== 'object' || typeof event.ms !== 'number' || !Number.isFinite(event.ms) || event.ms < previous || typeof event.kind !== 'string' || !Object.hasOwn(event, 'data')) throw new Error('Invalid replay event');
    previous = event.ms;
  }
  const html = await readFile(fileURLToPath(new URL('./replay-viewer.html', import.meta.url)), 'utf8');
  const player = await readFile(fileURLToPath(new URL('./replay-player.js', import.meta.url)), 'utf8');
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET') { response.writeHead(405).end(); return; }
    if (request.url === '/') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html); return; }
    if (request.url === '/replay-player.js') { response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }).end(player); return; }
    if (request.url === '/replay.json') { response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(content); return; }
    response.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') { server.close(); throw new Error('Could not start viewer'); }
  return `http://127.0.0.1:${address.port}/`;
}
