import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { createComponentRegistry } from '../src/components/registry';
import { validateViewDefinition, validateRequest } from '../src/runtime/shared/validation';
import type { ViewDefinition } from '../src/runtime/view/types';
import type { InlineSchemaSource } from '../src/runtime/schema/types';
const registry = createComponentRegistry();
const source: InlineSchemaSource = {
  request: { path: '$state.request.path', query: '$state.request.query' },
  definitionCache: 'view',
};
const scopes: ViewRuntime[] = [];
afterEach(() => scopes.splice(0).forEach(scope => scope.dispose()));
function setup(path: unknown = '/api/ui/create', query: unknown = {}) {
  const transport = vi.fn(async () => ({ type: 'fragment', root: { type: 'text', props: { value: 'Loaded' } } }));
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const definition: ViewDefinition = {
    id: 'dynamic-request', title: 'Dynamic request', initialState: JSON.parse(JSON.stringify({ request: { path, query } })),
    dataSources: {}, actions: { open: { type: 'state.set', target: 'request', value: '$event.value' } },
    root: { id: 'outlet', type: 'schema-outlet', source },
  };
  validateViewDefinition(definition, registry);
  const scope = new ViewRuntime(definition, environment); scopes.push(scope);
  return { environment, scope, transport };
}
describe('initiator-owned schema HTTP request', () => {
  it('validates full path/query expressions and resolves them without encoding URL separators', () => {
    const { environment, scope } = setup('/api/ui/forms/create?mode=compact', { team: 'engineering' });
    const prepared = scope.schemaFragments.prepare(source);
    expect(prepared.error).toBeUndefined();
    expect(prepared.request).toEqual({ method: 'GET', path: '/api/ui/forms/create?mode=compact', query: { team: 'engineering' } });
    expect(environment.resolver.resolvePath('/api/ui/$state.request.query.team', { state: environment.store.getState(), scope })).toBe('/api/ui/engineering');
  });
  it('treats resolved user query values as literal data without a second expression pass', () => {
    const { scope } = setup('/api/ui/search', { search: '$ordinary-user-text', nested: { value: '$another-literal' } });
    const prepared = scope.schemaFragments.prepare(source);
    expect(prepared.error).toBeUndefined();
    expect(prepared.request?.query).toEqual({ search: '$ordinary-user-text', nested: { value: '$another-literal' } });
  });
  it('changes resource identity when an action changes only the URL or query object', async () => {
    const { scope } = setup('/api/ui/first', { contextId: 'one' });
    const first = scope.schemaFragments.prepare(source, 'same');
    await scope.actionEngine.execute('open', { event: { value: { path: '/api/ui/second', query: { contextId: 'one' } } } });
    const second = scope.schemaFragments.prepare(source, 'same');
    await scope.actionEngine.execute('open', { event: { value: { path: '/api/ui/second', query: { search: 'Alex', department: 'finance' } } } });
    const third = scope.schemaFragments.prepare(source, 'same');
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
    expect(third.request?.query).toEqual({ search: 'Alex', department: 'finance' });
  });
  it.each([null, '', 'https://example.com/schema', '//example.com/schema', '/api/../../outside', '/api/..\\\\outside'])('rejects unresolved/invalid full paths before transport: %j', async path => {
    const { scope, transport } = setup(path);
    const prepared = scope.schemaFragments.prepare(source);
    expect(prepared.error).toMatch(/path/);
    const lease = scope.schemaFragments.acquire(source, null, () => {});
    await lease.promise; lease.release();
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([null, [], 'invalid', 3])('rejects a non-object resolved query: %j', async query => {
    const { scope, transport } = setup('/api/ui/schema', query);
    expect(scope.schemaFragments.prepare(source).error).toMatch(/query/);
    const lease = scope.schemaFragments.acquire(source, null, () => {});
    await lease.promise; lease.release();
    expect(transport).not.toHaveBeenCalled();
  });
  it('keeps action/datasource request declaration validation strict and rejects malformed schema expressions', () => {
    expect(() => validateRequest({ method: 'GET', path: '$state.request.path' })).toThrow('local /api/');
    const { scope } = setup();
    for (const path of ['$unknown.path', '$state.request.path/suffix']) {
      const invalid = { ...scope.definition, title: 'Invalid', root: { id: 'bad', type: 'schema-outlet', source: { request: { path } } } };
      expect(() => validateViewDefinition(invalid, registry)).toThrow();
    }
  });
});
