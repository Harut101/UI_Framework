import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
let server: Server;
let base: string;
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing server address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
describe('initial demo API', () => {
  it('serves health', async () => { expect(await (await fetch(`${base}/api/health`)).json()).toMatchObject({ ok: true }); });
  it('serves a small demo fixture', async () => {
    expect(await (await fetch(`${base}/api/demo-message`)).json()).toEqual({ message: 'Hello from the demo API.' });
  });
  it('serves the datasource items and supports search', async () => {
    const all = await (await fetch(base + '/api/items')).json();
    expect(all.items).toHaveLength(6);
    const filtered = await (await fetch(base + '/api/items?search=revenue')).json();
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0].title).toBe('Revenue overview');
  });
  it('returns a controlled datasource failure and recovers', async () => {
    const response = await fetch(base + '/api/items?fail=true');
    expect(response.status).toBe(503); expect((await response.json()).message).toContain('Simulated API failure');
    expect((await fetch(base + '/api/items')).status).toBe(200);
  });
  it('returns JSON for unknown API endpoints', async () => {
    const response = await fetch(`${base}/api/missing`); expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: 'Unknown API endpoint' });
  });
});
