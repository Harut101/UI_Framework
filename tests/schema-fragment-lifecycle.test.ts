import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { FragmentRuntime } from '../src/runtime/fragment/FragmentRuntime';
import { createComponentRegistry } from '../src/components/registry';
import { validateLoadedFragment } from '../src/runtime/fragment/normalizeFragmentDefinition';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import type { LoadedSchemaDefinition } from '../src/runtime/fragment/types';
import type { DefinitionCachePolicy, InlineSchemaSource } from '../src/runtime/schema/types';
import type { ViewDefinition } from '../src/runtime/shared/types';
import type { ApiTransport } from '../src/runtime/datasource/api';
const registry = createComponentRegistry();
const wire = { type: 'fragment', state: { query: 'initial' }, root: { type: 'text', bindings: { value: '$state.query' } } };
const environments: RuntimeEnvironment[] = [];
afterEach(() => environments.splice(0).forEach(env => env.applicationScope?.dispose()));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function setup(transport: ApiTransport = vi.fn(async () => wire)) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); environments.push(environment);
  const definition: ViewDefinition = { id: 'inline-view', title: 'Inline', initialState: { query: 'one' }, actions: { query: { type: 'state.set', target: 'query', value: '$event.value' } }, dataSources: {}, root: { id: 'outlet', type: 'schema-outlet', source: { request: { path: '/api/ui/$state.query' }, cache: 'view' } } };
  const runtime = new ViewRuntime(definition, environment);
  const validate = (value: unknown): asserts value is LoadedSchemaDefinition => validateLoadedFragment(value, definition, registry);
  return { environment, runtime, transport, definition, validate };
}
const source = (cache: DefinitionCachePolicy): InlineSchemaSource => ({ request: { path: '/api/ui/$state.query' }, cache });
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }

describe('inline schema acquisition and definition cache ownership', () => {
  it('validates inline requests without schemaSources registration', () => {
    const { definition } = setup(); expect(definition.schemaSources).toBeUndefined();
    expect(() => validateViewDefinition(definition, registry)).not.toThrow();
  });
  it.each(['none', 'scope', 'view', 'application'] as const)('%s stores JSON separately from leases and follows definition reuse policy', async cache => {
    const { runtime, environment, transport, validate } = setup(); const declaration = source(cache);
    const lease = runtime.schemaFragments.acquire(declaration, 'one', validate); await lease.promise;
    lease.release(); await tick();
    expect(environment.schemaCache.requests.size).toBe(0);
    expect(environment.schemaCache.entries.size).toBe(cache === 'none' ? 0 : 1);
    for (const entry of environment.schemaCache.entries.values()) {
      expect(JSON.parse(JSON.stringify(entry))).toEqual(entry);
      expect(Object.keys(entry).sort()).toEqual(['cache', 'owner', 'schema']);
      expect(entry.schema).not.toBe(wire);
    }
    const again = runtime.schemaFragments.acquire(declaration, 'one', validate); await again.promise; again.release();
    expect(transport).toHaveBeenCalledTimes(cache === 'none' ? 2 : 1);
  });
  it('uses the nearest view as cache owner for sources declared in a fragment', async () => {
    const { runtime, environment, validate, transport } = setup();
    const fragment = new FragmentRuntime({ type: 'fragment', state: { query: 'one' }, root: { type: 'text' } }, runtime, registry);
    const first = fragment.scope.schemaFragments.acquire(source('view'), 'one', validate); await first.promise; first.release(); await tick();
    expect([...environment.schemaCache.entries.values()][0].owner).toBe(runtime.scopeId);
    fragment.dispose(); expect(environment.schemaCache.entries.size).toBe(1);
    const next = new FragmentRuntime({ type: 'fragment', state: { query: 'one' }, root: { type: 'text' } }, runtime, registry);
    const reused = next.scope.schemaFragments.acquire(source('view'), 'one', validate); await reused.promise;
    expect(transport).toHaveBeenCalledTimes(1);
    runtime.dispose(); expect(environment.schemaCache.entries.size).toBe(0); expect(environment.schemaCache.requests.size).toBe(0);
  });
  it('does not reuse cached JSON when a resolved query changes under the same key', async () => {
    const { runtime, transport, validate } = setup();
    const declaration: InlineSchemaSource = { request: { path: '/api/ui/shared', method: 'POST', body: { query: '$state.query' } }, cache: 'application' };
    const first = runtime.schemaFragments.acquire(declaration, null, validate); await first.promise; first.release(); await tick();
    await runtime.actionEngine.execute('query', { event: { value: 'two' } });
    const second = runtime.schemaFragments.acquire(declaration, null, validate); await second.promise;
    expect(second.id).not.toBe(first.id); expect(transport).toHaveBeenCalledTimes(2);
    expect(vi.mocked(transport).mock.calls.map(([request]) => request.body)).toEqual([{ query: 'one' }, { query: 'two' }]);
  });
  it('shares pending inline requests, aborts only after the final lease, and rejects late results', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { runtime, environment, validate } = setup(transport);
    const first = runtime.schemaFragments.acquire(source('application'), null, validate);
    const second = runtime.schemaFragments.acquire(source('application'), null, validate);
    expect(first.promise).toBe(second.promise); await tick(); first.release(); await tick();
    expect(transport.mock.calls[0][1].aborted).toBe(false); second.release(); await tick();
    expect(transport.mock.calls[0][1].aborted).toBe(true); pending.resolve(wire); await second.promise;
    expect(environment.store.getState().schemaFragments).toEqual({}); expect(environment.schemaCache.entries.size).toBe(0);
  });
  it('cleans all cache policies when the application is disposed, even if leases were not released', async () => {
    const { runtime, environment, validate } = setup();
    await Promise.all((['none', 'scope', 'view', 'application'] as const).map(cache => runtime.schemaFragments.acquire(source(cache), null, validate).promise));
    environment.applicationScope!.dispose(); await tick();
    expect(environment.schemaCache.entries.size).toBe(0); expect(environment.schemaCache.requests.size).toBe(0);
    expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it.each([
    { request: { path: '/api/ui' }, cache: 'forever' },
    { request: { path: '/api/ui' }, cache: 'view', definitionCache: 'application' },
    { request: { method: 'DELETE', path: '/api/ui' } },
    { request: { path: 'https://example.test/ui' } },
    { request: { path: '/api/ui' }, load: { strategy: 'onDemand' } },
  ])('rejects malformed inline source %j', bad => {
    const { definition } = setup();
    expect(() => validateViewDefinition({ ...definition, root: { ...definition.root, source: bad } }, registry)).toThrow();
  });
  it('accepts definitionCache and rejects invalid lifetime values', () => {
    const { definition } = setup(); definition.root.source = { request: { path: '/api/ui' }, definitionCache: 'view' };
    definition.root.lifecycle = { scopeLifetime: 'outlet' };
    expect(() => validateViewDefinition(definition, registry)).not.toThrow();
    expect(() => validateViewDefinition({ ...definition, root: { ...definition.root, lifecycle: { scopeLifetime: 'forever' } } }, registry)).toThrow('scopeLifetime');
  });
});
