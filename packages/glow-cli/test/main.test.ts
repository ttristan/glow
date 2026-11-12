import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { main } from '../src/main.js';

const output = { log: () => {}, error: () => {} };
test('help and invalid commands have useful exit codes', async () => {
  assert.equal(await main(['--help'], output), 0);
  assert.equal(await main(['bad'], output), 2);
});
test('health checks distinguish a healthy response from failure', async () => {
  const server = createServer((req, res) => { res.statusCode = req.url === '/health' ? 200 : 503; res.end(); });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No TCP address');
    const url = `http://127.0.0.1:${address.port}`;
    assert.equal(await main(['health', `${url}/health`], output), 0);
    assert.equal(await main(['health', `${url}/bad`], output), 1);
  } finally { server.close(); await once(server, 'close'); }
});
