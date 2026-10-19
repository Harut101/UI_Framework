import { describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { FragmentRuntime } from '../src/runtime/fragment/FragmentRuntime';
import { createComponentRegistry } from '../src/components/registry';
import { validateLoadedFragment } from '../src/runtime/fragment/normalizeFragmentDefinition';
import { actionLogEntries, dependencyExpression, inspectScopeHierarchy, lifecycleLogEntries, schemaLogEntries } from '../src/playground/application-tab/inspectorModel';
import type { FragmentDefinition, LoadedSchemaDefinition } from '../src/runtime/fragment/types';
import type { ViewDefinition, RequestDefinition } from '../src/runtime/shared/types';
import type { ApiTransport } from '../src/runtime/datasource/api';

const registry = createComponentRegistry();
const viewDefinition: ViewDefinition = { id: 'host:with-colons', title: 'Host', initialState: { query: 'view' }, dataSources: {}, actions: {}, root: { id: 'root', type: 'stack' } };
const template: FragmentDefinition = { type: 'fragment', id: 'same:definition', state: { query: 'initial' }, actions: { setQuery: { type: 'state.set', target: 'query', value: '$event.value' } }, dataSources: {
  items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { search: '$state.query' } }, dependsOn: ['$state.query', '$viewState.query'], load: { strategy: 'manual' } },
}, root: { type: 'text', bindings: { value: '$state.query' } } };
const deferred = () => { let resolve!: (value: unknown) => void; let reject!: (reason: unknown) => void; const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

describe('scope inspector projections and telemetry', () => {
  it('projects actual nested ownership, scoped resources and registrations without changing Redux or fetching', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({}));
    const env = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
    const view = new ViewRuntime(viewDefinition, env);
    const a = new FragmentRuntime(template, view, registry);
    const b = new FragmentRuntime(template, a.scope, registry);
    const c = new FragmentRuntime(template, view, registry);
    try {
      await a.scope.actionEngine.execute('setQuery', { event: { value: 'only A' } });
      const before = env.store.getState(); const graph = env.dependencyGraph.registrations();
      const roots = inspectScopeHierarchy(env, before); const root = roots[0]; const host = root.children[0];
      expect(root.scopeId).toBe(view.applicationScopeId); expect(root.type).toBe('application');
      expect(host.definitionId).toBe('host:with-colons');
      expect(host.children.map(node => node.scopeId)).toEqual([a.scopeId, c.scopeId]);
      expect(host.children[0].children[0].scopeId).toBe(b.scopeId);
      expect(host.children.map(node => node.definitionId)).toEqual(['same:definition', 'same:definition']);
      expect(host.children[0].state).toEqual({ query: 'only A' }); expect(host.children[1].state).toEqual({ query: 'initial' });
      expect(host.children[0].dataSources[0]).toMatchObject({ sourceId: 'items', entry: { status: 'idle', loading: false, data: null, error: null } });
      expect(host.children[0].actions.setQuery.type).toBe('state.set');
      expect(host.children[0].dependencies[0]).toEqual(graph.find(edge => edge.target.scopeId === a.scopeId));
      expect(dependencyExpression(host.children[0].dependencies[0].paths[0], a.scopeId, env)).toBe('$state.query');
      expect(dependencyExpression(host.children[0].dependencies[0].paths[1], a.scopeId, env)).toBe('$viewState.query');
      expect(a.scope.environment.store).toBe(view.environment.store); expect(b.scope.environment.store).toBe(view.environment.store);
      expect(env.store.getState()).toBe(before); expect(transport).not.toHaveBeenCalled();
      const action = actionLogEntries(env.diagnostics.snapshot())[0];
      expect(action.metadata).toMatchObject({ instance: a.scopeId, actionId: 'setQuery', actionType: 'state.set', target: 'query', value: 'only A' });
      a.dispose();
      expect(inspectScopeHierarchy(env, env.store.getState())[0].children[0].children.map(node => node.scopeId)).toEqual([c.scopeId]);
      expect(env.dependencyGraph.registrations().some(edge => [a.scopeId, b.scopeId].includes(edge.target.scopeId))).toBe(false);
    } finally { view.applicationScope.dispose(); }
    expect(inspectScopeHierarchy(env, env.store.getState())).toEqual([]);
    expect(env.store.getState().fragments).toEqual({});
  });

  it('records resolved datasource requests on success, errors and cancellation while rejecting stale completions', async () => {
    const first = deferred(); const second = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise).mockRejectedValueOnce(new Error('API unavailable'));
    const env = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); const view = new ViewRuntime(viewDefinition, env);
    const fragment = new FragmentRuntime(template, view, registry);
    try {
      const pending = fragment.scope.dataSources.reload('items');
      await fragment.scope.actionEngine.execute('setQuery', { event: { value: 'new query' } });
      const latest = fragment.scope.dataSources.reload('items');
      expect(transport.mock.calls[0][1].aborted).toBe(true);
      second.resolve({ items: ['current'] }); await latest;
      const count = lifecycleLogEntries(env.diagnostics.snapshot()).length;
      first.resolve({ items: ['obsolete'] }); await pending;
      expect(lifecycleLogEntries(env.diagnostics.snapshot())).toHaveLength(count);
      await fragment.scope.dataSources.reload('items');
      const events = lifecycleLogEntries(env.diagnostics.snapshot()).reverse();
      expect(events.map(entry => entry.metadata?.event)).toEqual(['loading', 'cancelled', 'loading', 'success', 'loading', 'error']);
      for (const entry of events) expect(entry.metadata).toMatchObject({ instance: fragment.scopeId, datasourceId: 'items', resource: { scopeId: fragment.scopeId, sourceId: 'items' }, request: { method: 'GET', path: '/api/items' } });
      expect(events[0].metadata?.request?.query).toEqual({ search: 'initial' });
      expect(events.at(-1)?.metadata?.request?.query).toEqual({ search: 'new query' });
      expect(schemaLogEntries(env.diagnostics.snapshot())).toEqual([]);
    } finally { view.applicationScope.dispose(); }
  });

  it('records already-resolved generic action values without evaluating them a second time', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ result: 'response' }));
    const navigate = vi.fn(); const notify = vi.fn();
    const env = new RuntimeEnvironment(navigate, notify, transport);
    const view = new ViewRuntime({ ...viewDefinition, actions: {
      flow: { type: 'sequence', actions: ['load', 'message', 'go', 'invalidate', 'reload'] },
      load: { type: 'api.request', request: { method: 'POST', path: '/api/items', body: { query: '$state.query' } }, target: 'result' },
      message: { type: 'notification.show', message: '$response.result' },
      go: { type: 'navigate', to: '$event.value' },
      invalidate: { type: 'datasource.invalidate', source: 'items' },
      reload: { type: 'datasource.reload', source: 'items' },
    }, dataSources: { items: { ...template.dataSources!.items, load: { strategy: 'manual' } } } }, env);
    try {
      await view.actionEngine.execute('flow', { event: { value: '/demo' } });
      const entries = actionLogEntries(env.diagnostics.snapshot()).filter(entry => entry.metadata?.event === 'resolved');
      expect(entries).toEqual(expect.arrayContaining([
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'load', target: '(request)', value: { method: 'POST', path: '/api/items', body: { query: 'view' } } }) }),
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'load', target: 'result', value: { result: 'response' } }) }),
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'message', value: 'response' }) }),
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'go', value: '/demo' }) }),
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'reload', value: 'items' }) }),
        expect.objectContaining({ metadata: expect.objectContaining({ actionId: 'invalidate', value: 'items' }) }),
      ]));
      expect(entries.every(entry => entry.metadata?.instance === view.scopeId)).toBe(true);
      expect(navigate).toHaveBeenCalledExactlyOnceWith('/demo'); expect(notify).toHaveBeenCalledExactlyOnceWith('response', 'info');
      expect(transport).toHaveBeenCalledTimes(2);
    } finally { view.applicationScope.dispose(); }
  });

  it('keeps definition HTTP/cache/error/cancellation logs separate from fragment datasource loading', async () => {
    const pending = deferred();
    const transport = vi.fn<ApiTransport>(async (request: RequestDefinition) => {
      if (request.path === '/api/ui/fail') throw new Error('Definition unavailable');
      if (request.path === '/api/ui/pending') return pending.promise;
      return template;
    });
    const env = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); const view = new ViewRuntime(viewDefinition, env);
    const validate = (value: unknown): asserts value is LoadedSchemaDefinition => validateLoadedFragment(value, view.definition, registry);
    const source = { request: { path: '/api/ui/fragment' }, cache: 'view' as const };
    try {
      const lease = view.schemaFragments.acquire(source, 'same-key', validate);
      const shared = view.schemaFragments.acquire(source, 'same-key', validate);
      await lease.promise; expect(transport).toHaveBeenCalledTimes(1);
      lease.release(); shared.release(); await Promise.resolve();
      const cached = view.schemaFragments.acquire(source, 'same-key', validate); await cached.promise;
      expect(transport).toHaveBeenCalledTimes(1);
      expect(schemaLogEntries(env.diagnostics.snapshot()).map(entry => entry.metadata?.event).reverse()).toEqual(['loading', 'success', 'cacheHit', 'success']);
      const failed = view.schemaFragments.acquire({ request: { path: '/api/ui/fail' } }, null, validate); await failed.promise;
      const waiting = view.schemaFragments.acquire({ request: { path: '/api/ui/pending' } }, null, validate); await Promise.resolve();
      waiting.release(); await Promise.resolve();
      expect(transport.mock.calls.at(-1)![1].aborted).toBe(true);
      const events = schemaLogEntries(env.diagnostics.snapshot());
      expect(events[0].metadata?.event).toBe('cancelled');
      expect(events.some(entry => entry.metadata?.event === 'error' && entry.detail === 'Definition unavailable')).toBe(true);
      for (const entry of events) {
        expect(entry.metadata?.instance).toBe(view.scopeId); expect(entry.metadata?.datasourceId).toBeUndefined();
        expect(entry.metadata?.schemaResource?.source).toBe('inline'); expect(entry.metadata?.request?.path).toMatch(/^\/api\/ui\//);
      }
      const count = events.length; pending.resolve(template); await waiting.promise;
      expect(schemaLogEntries(env.diagnostics.snapshot())).toHaveLength(count);
      expect(lifecycleLogEntries(env.diagnostics.snapshot())).toEqual([]);
      expect(env.listScopes().some(scope => scope.type === 'fragment')).toBe(false);
      cached.release(); failed.release();
    } finally { view.applicationScope.dispose(); }
  });
});
