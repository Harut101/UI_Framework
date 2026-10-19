import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
import { resolveRequestPath } from '../src/runtime/datasource/api';
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
const get = async (path: string) => (await fetch(base + path)).json();
describe('reporting demo APIs', () => {
  it('provides app navigation and the signed-in demo profile', async () => {
    const navigation = await get('/api/app/navigation');
    expect(navigation.items.find((item: { id: string }) => item.id === 'reporting').links).toContainEqual(expect.objectContaining({ id: 'reporting.catalog', href: '/application/catalog' }));
    expect(await get('/api/me')).toEqual({ user: { name: 'Alex Morgan', initials: 'AM', role: 'Workspace administrator' } });
  });
  it('returns seeded records and truthful facet counts', async () => {
    const all = await get('/api/reports'); const facets = await get('/api/report-facets');
    expect(all.items).toHaveLength(24); expect(all.total).toBe(24); expect(all.subtitle).toContain('24 report definitions');
    expect(facets.modules.find((item: { id: string }) => item.id === 'active-directory').count).toBe(5);
    expect(facets.collections.find((item: { id: string }) => item.id === 'saved').count).toBe(6);
    expect(facets.moduleOptions[0]).toEqual({ value: '', label: 'All Module types' });
  });
  it('combines module, framework, and report type filters', async () => {
    const result = await get('/api/reports?module=active-directory&framework=soc2&type=audit');
    expect(result.items.map((item: { id: string }) => item.id)).toEqual(['privileged-access', 'access-certification', 'delegated-access']);
    expect(result.total).toBe(3);
  });
  it('searches case-insensitively across report names and control references', async () => {
    expect((await get('/api/reports?search=PRIVILEGED%20ACCESS')).items[0].id).toBe('privileged-access');
    expect((await get('/api/reports?search=NIST%20CM-3')).items.map((item: { id: string }) => item.id)).toEqual(['gpo-changes', 'policy-changes']);
    expect(await get('/api/reports?search=does-not-exist')).toMatchObject({ items: [], total: 0 });
  });
  it('filters collections, owner, and published status', async () => {
    expect((await get('/api/reports?collection=saved')).total).toBe(6);
    expect((await get('/api/reports?collection=custom')).total).toBe(3);
    expect((await get('/api/reports?collection=updated')).total).toBe(8);
    expect((await get('/api/reports?publishedOnly=true')).total).toBe(23);
    const owned = await get('/api/reports?owner=Identity%20Operations');
    expect(owned.total).toBe(8);
    expect(owned.items.every((item: { owner: string }) => item.owner === 'Identity Operations')).toBe(true);
  });
  it('loads details and runs a report with a unique completion receipt', async () => {
    const before = await get('/api/reports/privileged-access');
    expect(before.report).toMatchObject({ id: 'privileged-access', parameters: expect.any(Array), controls: expect.any(Array) });
    const run = await (await fetch(base + '/api/reports/privileged-access/run', { method: 'POST' })).json();
    expect(run).toMatchObject({ reportId: 'privileged-access', status: 'completed', rowCount: 18 });
    expect(run.id).toEqual(expect.any(String));
    expect((await get('/api/reports/privileged-access')).report.lastRun).toBe(run.completedAt);
  });
  it('returns JSON 404s for missing report details and runs', async () => {
    for (const [path, method] of [['/api/reports/missing', 'GET'], ['/api/reports/missing/run', 'POST']]) {
      const response = await fetch(base + path, { method });
      expect(response.status).toBe(404); expect(await response.json()).toEqual({ message: 'Report not found' });
    }
  });
});
describe('generic request path parameters', () => {
  it('encodes identifiers without interpreting them as URL structure', () => {
    expect(resolveRequestPath({ method: 'GET', path: '/api/resources/{id}', params: { id: 'space / ?' } })).toBe('/api/resources/space%20%2F%20%3F');
    expect(resolveRequestPath({ method: 'POST', path: '/api/resources/{id}/run', params: { id: 42 } })).toBe('/api/resources/42/run');
  });
  it('rejects missing path parameters rather than requesting the collection by accident', () => {
    expect(() => resolveRequestPath({ method: 'GET', path: '/api/resources/{id}' })).toThrow('Missing request path parameter');
    expect(() => resolveRequestPath({ method: 'GET', path: '/api/resources/{id}', params: { id: '' } })).toThrow('Missing request path parameter');
  });
});

