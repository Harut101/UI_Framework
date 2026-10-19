import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
let server: Server; let base: string;
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing server address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
const get = async (query = '') => (await fetch(base + '/api/users' + query)).json();
describe('seeded users API', () => {
  it('returns realistic users and truthful global navigation counts', async () => {
    const result = await get(); expect(result.items).toHaveLength(12); expect(result.total).toBe(12);
    expect(result.items[0]).toMatchObject({ name: 'Ava Patel', departmentId: 'engineering', status: 'active', email: 'ava.patel@example.com' });
    expect(result.departments).toContainEqual({ id: 'engineering', label: 'Engineering', count: 4 });
    expect(result.statuses).toContainEqual({ id: 'disabled', label: 'Disabled users', count: 3 });
  });
  it('filters departments without implicitly filtering status', async () => {
    const result = await get('?department=engineering'); expect(result.total).toBe(4);
    expect(result.items.map((user: { name: string }) => user.name)).toEqual(['Ava Patel', 'Noah Kim', 'Mia Chen', 'Ethan Reed']);
  });
  it('combines department and status filters', async () => {
    const result = await get('?department=engineering&status=disabled');
    expect(result.total).toBe(1); expect(result.items[0].name).toBe('Mia Chen');
    expect((await get('?status=disabled')).total).toBe(3);
  });
  it('searches names, roles, and emails case-insensitively', async () => {
    expect((await get('?search=AVA')).items[0].id).toBe('ava-patel');
    expect((await get('?search=financial')).total).toBe(2);
    expect((await get('?search=noah.kim%40example.com')).total).toBe(1);
  });
  it('returns empty results safely for unavailable departments/statuses/searches', async () => {
    for (const query of ['?department=missing', '?status=missing', '?search=not-a-person']) expect(await get(query)).toMatchObject({ items: [], total: 0 });
  });
});
