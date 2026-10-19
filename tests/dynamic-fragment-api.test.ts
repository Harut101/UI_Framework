import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../backend/app';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { normalizeFragmentDefinition } from '../src/runtime/fragment/normalizeFragmentDefinition';
let server: Server; let base: string;
beforeAll(async () => { server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No server'); base = `http://127.0.0.1:${address.port}`; });
afterAll(async () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const get = (path: string) => fetch(base + path);
const registry = registerApplicationComponents(createComponentRegistry());
describe('HTTP-loaded self-contained fragments and contextual items', () => {
  it('returns a validated FragmentDefinition containing all local state, sources, named actions and UI', async () => {
    const response = await get('/api/ui/fragments/items-panel/workspace'); expect(response.ok).toBe(true);
    const wire: unknown = await response.json(); const definition = normalizeFragmentDefinition(wire, registry);
    expect(definition.state).toEqual({ query: '', selectedId: null, failRequests: false, slowRequests: false, showAdvanced: false });
    expect(Object.keys(definition.actions).sort()).toEqual(['reloadItems', 'selectItem', 'setFailure', 'setQuery', 'setSlowRequests', 'toggleAdvanced']);
    expect(definition.dataSources.items.request).toMatchObject({ path: '/api/items', query: { contextId: 'workspace', search: '$state.query', fail: '$state.failRequests', slow: '$state.slowRequests' } });
    expect(definition.dataSources.items.load.strategy).toBe('onScopeInit'); expect(definition.dataSources.items.dependsOn).toEqual(['$state.query', '$state.failRequests', '$state.slowRequests']);
    expect(JSON.stringify(definition.root)).toContain('schema-outlet'); expect(JSON.stringify(definition.root)).toContain('$state.showAdvanced');
  });
  it('injects each context into a fresh response without mutating the shared definition template', async () => {
    for (const context of ['finance', 'operations', 'workspace', 'finance']) {
      const wire = await (await get('/api/ui/fragments/items-panel/' + context)).json();
      expect(wire.dataSources.items.request.query.contextId).toBe(context); expect(wire.state.query).toBe('');
    }
  });
  it('returns a nested fragment with independent local state/actions over HTTP', async () => {
    const wire: unknown = await (await get('/api/ui/fragments/item-note/workspace--item-1')).json();
    const definition = normalizeFragmentDefinition(wire, registry); expect(definition.id).toBe('item-note'); expect(definition.state).toEqual({ note: '', pinned: false });
    expect(Object.keys(definition.actions)).toEqual(['setNote', 'setPinned']); expect(JSON.stringify(definition.root)).toContain('workspace--item-1');
  });
  it('filters contextual items by search and returns stable context-specific ids', async () => {
    const finance = await (await get('/api/items?contextId=finance&search=REVENUE')).json();
    expect(finance).toMatchObject({ total: 2, contextId: 'finance' }); expect(finance.items.every((item: { id: string }) => item.id.startsWith('finance--'))).toBe(true);
    const operations = await (await get('/api/items?contextId=operations&search=directory')).json();
    expect(operations.items).toHaveLength(1); expect(operations.items[0].title).toBe('Directory health');
    const custom = await (await get('/api/items?contextId=constructor')).json(); expect(custom.total).toBe(6);
    const empty = await (await get('/api/items?contextId=finance&search=missing')).json(); expect(empty).toMatchObject({ items: [], total: 0 });
  });
  it('supports controlled failure and recovery for a context', async () => {
    const failed = await get('/api/items?contextId=finance&fail=true'); expect(failed.status).toBe(503); expect((await failed.json()).message).toContain('Simulated API failure');
    expect((await get('/api/items?contextId=finance&fail=false')).status).toBe(200);
  });
  it('supports slow mode without changing the response contract', async () => {
    const start = Date.now(); const response = await get('/api/items?contextId=operations&slow=true'); expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
    expect(await response.json()).toMatchObject({ total: 4, contextId: 'operations' });
  });
  it('rejects invalid context/item identifiers with controlled JSON errors', async () => {
    for (const path of ['/api/items?contextId=Bad!', '/api/items?contextId=a&contextId=b', '/api/ui/fragments/items-panel/Bad!', '/api/ui/fragments/item-note/Bad!']) expect((await get(path)).status).toBe(400);
  });
});

