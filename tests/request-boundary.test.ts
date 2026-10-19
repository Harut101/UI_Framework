import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { validateRequest, validateViewDefinition } from '../src/runtime/shared/validation';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { readTreeNodes, projectDataTree } from '../src/runtime/data-tree/treeData';
import type { ApiTransport } from '../src/runtime/datasource/api';
import { createFetchTransport } from '../src/runtime/datasource/api';
import type { RequestDefinition } from '../src/runtime/datasource/types';
import type { ViewDefinition } from '../src/runtime/view/types';
import type { InlineSchemaSource } from '../src/runtime/schema/types';

const registry = new ComponentRegistry().register('text', () => null);
const scopes: ViewRuntime[] = [];
afterEach(() => { scopes.splice(0).forEach(scope => scope.applicationScope.dispose()); vi.unstubAllGlobals(); });
const source: InlineSchemaSource = { request: '$state.request', definitionCache: 'view' };
function setup(initialState: ViewDefinition['initialState'] = {}, environment = new RuntimeEnvironment(vi.fn(), vi.fn(), vi.fn(async () => ({ type: 'fragment', root: { type: 'text' } })))) {
  const definition: ViewDefinition = {
    id: 'boundary', title: 'Boundary', initialState, dataSources: {},
    actions: { change: { type: 'state.set', target: 'request', value: '$event.value' } },
    root: { id: 'text', type: 'text' },
  };
  const scope = new ViewRuntime(definition, environment); scopes.push(scope);
  return { scope, environment };
}
describe('separate author expressions, resolved data and host URL policy', () => {
  it('accepts a whole request binding and preserves GET/POST, query/body literals and resource identity', async () => {
    const { scope } = setup({ request: { path: '/api/ui/schema', query: { search: '$sales' } } });
    const first = scope.schemaFragments.prepare(source, 'same');
    expect(first.error).toBeUndefined(); expect(first.request).toMatchObject({ method: 'GET', query: { search: '$sales' } });
    await scope.actionEngine.execute('change', { event: { value: { method: 'POST', path: '/api/ui/schema', body: { value: '$response.literal' } } } });
    const second = scope.schemaFragments.prepare(source, 'same');
    expect(second.error).toBeUndefined(); expect(second.request).toEqual({ method: 'POST', path: '/api/ui/schema', body: { value: '$response.literal' } });
    expect(second.id).not.toBe(first.id);
    await scope.actionEngine.execute('change', { event: { value: { ...second.request, body: { value: 'another body' } } } });
    expect(scope.schemaFragments.prepare(source, 'same').id).not.toBe(second.id);
  });
  it.each(['PUT', 'DELETE', 'invalid'])('rejects unsupported schema request methods before HTTP: %s', method => {
    const { scope, environment } = setup({ request: { method, path: '/api/schema' } });
    expect(scope.schemaFragments.prepare(source).error).toContain('GET or POST');
    expect(environment.transport).not.toHaveBeenCalled();
  });
  it('validates a whole-request declaration and rejects unknown request fields rather than dropping them', () => {
    const { scope } = setup({ request: { path: '/api/schema', headers: { Authorization: 'demo' } } });
    validateViewDefinition({ ...scope.definition, root: { id: 'outlet', type: 'schema-outlet', source } }, new ComponentRegistry().register('schema-outlet', () => null));
    expect(scope.schemaFragments.prepare(source).error).toContain('Unknown schema request property');
  });
  it.each(['$sales', '$100', '$state.user-input'])('loads navigation DATA with literal user input %s', async value => {
    const transport = vi.fn<ApiTransport>(async () => ({ items: [] }));
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
    const { scope } = setup({ query: value }, environment);
    const nodes = readTreeNodes([{ id: 'group', name: 'Group', childrenSource: { request: {
      method: 'POST', path: '/api/children', query: { search: '$state.query' }, body: { nested: { value: '$state.query' } },
    } } }]);
    const projection = projectDataTree(nodes, ['group'], {}, environment.resolver, { state: environment.store.getState(), scope }, environment.requestPolicy);
    expect(projection.items[0].childrenError).toBeNull();
    const lease = scope.dataSources.acquireInline(projection.requests[0].request);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0]).toMatchObject({ query: { search: value }, body: { nested: { value } } });
    lease.release();
    expect(() => validateRequest({ method: 'GET', path: '/api/data', query: { search: '$unknown.value' } })).toThrow('Unknown namespace');
  });
  it.each(['/api/../../outside', '/api/%2e%2e/outside', '/api/..\\outside', '//outside.test/api/x'])('applies identical policy to literal and bound paths: %s', path => {
    const { scope, environment } = setup({ request: { path } });
    expect(scope.schemaFragments.prepare({ request: { path } }).error).toMatch(/path/);
    expect(scope.schemaFragments.prepare(source).error).toMatch(/path/);
    expect(environment.transport).not.toHaveBeenCalled();
  });
  it('checks template segments and {params} after substitution', async () => {
    const transport = vi.fn(async () => ({}));
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
    const { scope } = setup({ segment: '..' }, environment);
    expect(scope.schemaFragments.prepare({ request: { path: '/api/$state.segment/outside' } }).error).toMatch(/path/);
    scope.definition.actions.invalid = { type: 'api.request', request: { method: 'GET', path: '/api/{id}/outside', params: { id: '..' } } };
    await expect(scope.actionEngine.execute('invalid')).rejects.toThrow('path');
    expect(transport).not.toHaveBeenCalled();
  });
  it('supports a host-configured local API prefix across named/inline sources, actions and schema requests', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ items: [] }));
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport, { allowedPathPrefixes: ['/v2/'] });
    const definition: ViewDefinition = {
      id: 'custom-api', title: 'Custom', initialState: { request: { method: 'POST', path: '/v2/schema', body: { value: '$literal' } } },
      dataSources: { items: { type: 'api', request: { method: 'GET', path: '/v2/items' }, load: { strategy: 'manual' } } },
      actions: { request: { type: 'api.request', request: { method: 'POST', path: '/v2/action' } } },
      root: { id: 'text', type: 'text' },
    };
    validateViewDefinition(definition, registry);
    const scope = new ViewRuntime(definition, environment); scopes.push(scope);
    expect(scope.schemaFragments.prepare(source).error).toBeUndefined();
    expect(scope.schemaFragments.prepare({ request: { path: '/api/rejected' } }).error).toContain('path');
    await scope.dataSources.reload('items'); await scope.actionEngine.execute('request');
    const lease = scope.dataSources.acquireInline({ method: 'GET', path: '/v2/children' });
    await new Promise(resolve => setTimeout(resolve, 0)); lease.release();
    expect(transport.mock.calls.map(call => (call as unknown as [RequestDefinition])[0].path)).toEqual(['/v2/items', '/v2/action', '/v2/children']);
  });
  it('enforces the same boundary in the default fetch transport', async () => {
    const fetch = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('window', { location: { origin: 'https://app.test' } }); vi.stubGlobal('fetch', fetch);
    const transport = createFetchTransport();
    await expect(transport({ method: 'GET', path: '/api/../../outside' }, new AbortController().signal)).rejects.toThrow('path');
    expect(fetch).not.toHaveBeenCalled();
    await transport({ method: 'GET', path: '/api/a/../b' }, new AbortController().signal);
    expect((fetch.mock.calls[0] as unknown as [URL])[0].pathname).toBe('/api/b');
  });
});
