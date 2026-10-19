import { afterEach, describe, expect, it, vi } from 'vitest';
import { DependencyGraph } from '../src/runtime/datasource/DependencyGraph';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { getChangedPaths } from '../src/runtime/redux/changedPaths';
import { createRuntimeStore } from '../src/runtime/redux/createRuntimeStore';
import { runtimeActions } from '../src/runtime/redux/runtimeActions';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { DataSourceDefinition, DependencyRegistration } from '../src/runtime/datasource/types';
import type { RuntimeScopeDefinition, ScopeAddressContext, ScopedChangedPath } from '../src/runtime/shared/types';

const roots: RuntimeScope[] = [];
function source(dependsOn: DataSourceDefinition['dependsOn'] = ['$state.query', '$state.filters.kind'], debounceMs = 0): DataSourceDefinition {
  return { type: 'api', request: { method: 'GET', path: '/api/items', query: { query: '$state.query', kind: '$state.filters.kind' } }, dependsOn,
    load: { strategy: 'onScopeInit', reload: 'onDependencyChange', debounceMs } };
}
function definition(query: string, dataSources: Record<string, DataSourceDefinition> = { items: source() }): RuntimeScopeDefinition {
  return { id: 'same-definition', initialState: { query, filters: { kind: 'all', status: 'active' }, unrelated: false }, dataSources,
    actions: {
      setQuery: { type: 'state.set', target: 'query', value: '$event.value' },
      patch: { type: 'state.patch', target: 'filters', value: { kind: '$event.kind', status: '$event.status' } },
      unrelated: { type: 'state.set', target: 'unrelated', value: true },
    } };
}
function setup(transport = vi.fn<ApiTransport>(async request => ({ query: request.query?.query, kind: request.query?.kind })), fragmentSources?: Record<string, DataSourceDefinition>) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const app = new RuntimeScope(definition('app'), 'application', environment); roots.push(app);
  const view = new RuntimeScope(definition('view'), 'view', environment, app);
  const a = new RuntimeScope(definition('A', fragmentSources), 'fragment', environment, view);
  const b = new RuntimeScope(definition('B', fragmentSources), 'fragment', environment, view);
  const data = (scope: RuntimeScope, sourceId = 'items') => environment.resolver.resolve('$data.' + sourceId, { state: environment.store.getState(), scope }) as import('../src/runtime/datasource/types').DataEntry;
  const scopes = [app, view, a, b];
  const start = async () => { scopes.forEach(scope => scope.start()); await flush(); transport.mockClear(); };
  return { environment, app, view, a, b, data, transport, start, scopes };
}
afterEach(() => { roots.splice(0).forEach(root => root.dispose()); vi.useRealTimers(); });
async function flush() { for (let index = 0; index < 8; index++) await Promise.resolve(); }
const change = (scopeId: string, path: string[], area: ScopedChangedPath['area'] = 'state'): ScopedChangedPath => ({ scopeId, area, path });
const context = (scopeId: string): ScopeAddressContext => ({ scopeId, applicationScopeId: 'APP', viewScopeId: 'VIEW' });
function deferred() {
  let resolve!: (value: unknown) => void; let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('scope-qualified DependencyGraph', () => {
  it('returns resource identities and deduplicates paths without mixing sibling scopes or areas', () => {
    const graph = new DependencyGraph();
    graph.registerScope(context('A'), { items: source() }); graph.registerScope(context('B'), { items: source() });
    expect(graph.affected([change('A', ['query'])])).toEqual([{ scopeId: 'A', sourceId: 'items' }]);
    expect(graph.affected([change('A', ['query']), change('A', ['filters', 'kind']), change('A', ['query'])])).toEqual([{ scopeId: 'A', sourceId: 'items' }]);
    expect(graph.affected([change('A', ['queryExtra']), change('A', ['query'], 'data'), change('other', ['query'])])).toEqual([]);
    expect(graph.affected([change('A', [])])).toEqual([{ scopeId: 'A', sourceId: 'items' }]);
    expect(graph.affected([change('B', ['filters'])])).toEqual([{ scopeId: 'B', sourceId: 'items' }]);
  });
  it('registers explicit owning-view/app reads against ancestor identities', () => {
    const graph = new DependencyGraph();
    graph.registerScope(context('A'), { items: source(['$state.query', '$viewState.query', '$appState.query']) });
    graph.registerScope(context('B'), { items: source(['$state.query', '$appState.query']) });
    expect(graph.affected([change('VIEW', ['query'])])).toEqual([{ scopeId: 'A', sourceId: 'items' }]);
    expect(graph.affected([change('APP', ['query'])])).toEqual([{ scopeId: 'A', sourceId: 'items' }, { scopeId: 'B', sourceId: 'items' }]);
    expect(graph.registrations()[0].paths).toEqual([change('A', ['query']), change('VIEW', ['query']), change('APP', ['query'])]);
  });
  it('isolates local data dependencies even when every scope uses the same source ids', () => {
    const graph = new DependencyGraph();
    for (const scopeId of ['A', 'B']) graph.registerScope(context(scopeId), { items: source(), summary: source(['$data.items.data.query']) });
    expect(graph.affected([change('A', ['items', 'data', 'query'], 'data')])).toEqual([{ scopeId: 'A', sourceId: 'summary' }]);
    expect(graph.affected([change('A', ['items', 'loading'], 'data')])).toEqual([]);
  });
  it('rejects cross-scope cycles atomically without partially adding other resources', () => {
    const graph = new DependencyGraph();
    graph.register([{ target: { scopeId: 'A', sourceId: 'items' }, paths: [change('B', ['items', 'data'], 'data')] }]);
    const before = graph.registrations();
    const added: DependencyRegistration[] = [
      { target: { scopeId: 'C', sourceId: 'safe' }, paths: [change('C', ['query'])] },
      { target: { scopeId: 'B', sourceId: 'items' }, paths: [change('A', ['items', 'data'], 'data')] },
    ];
    expect(() => graph.register(added)).toThrow('Circular'); expect(graph.registrations()).toEqual(before);
  });
  it('uses removable registrations and prevents an old release from deleting replacement edges', () => {
    const graph = new DependencyGraph();
    const releaseOld = graph.registerScope(context('A'), { items: source() });
    const releaseNew = graph.registerScope(context('A'), { items: source(['$state.other']) });
    releaseOld(); releaseOld();
    expect(graph.affected([change('A', ['query'])])).toEqual([]);
    expect(graph.affected([change('A', ['other'])])).toEqual([{ scopeId: 'A', sourceId: 'items' }]);
    const snapshot = graph.registrations() as DependencyRegistration[]; snapshot.splice(0);
    expect(graph.registrations()).toHaveLength(1);
    releaseNew(); expect(graph.registrations()).toEqual([]);
  });
  it('ignores unavailable owning-view reads for application-owned fragments and rejects unsafe dependency paths', () => {
    const graph = new DependencyGraph();
    graph.registerScope({ ...context('navigation'), viewScopeId: null }, { items: source(['$viewState.query', '$state.query']) });
    expect(graph.affected([change('VIEW', ['query'])])).toEqual([]);
    expect(graph.affected([change('navigation', ['query'])])).toEqual([{ scopeId: 'navigation', sourceId: 'items' }]);
    expect(() => graph.registerScope(context('bad'), { items: source(['$state.__proto__.query']) })).toThrow('Unsafe');
    expect(() => graph.registerScope(context('bad'), { items: source(['$event.query' as never]) })).toThrow('Invalid');
  });
});

describe('scoped listener and datasource isolation', () => {
  it('initializes independent idle state before start/first render and exposes composite identities', () => {
    const { scopes, environment, data, transport } = setup();
    for (const scope of scopes) {
      expect(data(scope)).toEqual({ status: 'idle', loading: false, data: null, error: null });
      expect(scope.dataSources.identity('items')).toEqual({ scopeId: scope.scopeId, sourceId: 'items' });
    }
    expect(data(scopes[2])).not.toBe(data(scopes[3])); expect(transport).not.toHaveBeenCalled();
    expect(environment.dependencyGraph.registrations().map(entry => entry.target)).toEqual(scopes.map(scope => scope.dataSources.identity('items')));
  });
  it('loads view and two fragments named items into three independent Redux data entries', async () => {
    const { scopes, view, a, b, data, transport } = setup();
    scopes.forEach(scope => scope.start()); await flush();
    expect(transport).toHaveBeenCalledTimes(4);
    expect(data(view).data).toMatchObject({ query: 'view' }); expect(data(a).data).toMatchObject({ query: 'A' }); expect(data(b).data).toMatchObject({ query: 'B' });
  });
  it('reloads only A/items on an A state change and retains host/sibling data references', async () => {
    const { environment, a, b, view, app, data, transport, start } = setup(); await start();
    const siblings = [data(b), data(view), data(app)];
    await a.actionEngine.execute('setQuery', { scope: a, event: { value: 'edited A' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query?.query).toBe('edited A');
    expect([data(b), data(view), data(app)]).toEqual(siblings);
    expect(data(b)).toBe(siblings[0]); expect(data(view)).toBe(siblings[1]); expect(data(app)).toBe(siblings[2]);
    const log = environment.diagnostics.snapshot().find(entry => entry.metadata?.event === 'dependencyChanged');
    expect(log?.metadata?.resource).toEqual({ scopeId: a.scopeId, sourceId: 'items' });
    expect(log?.metadata?.scopedChangedPaths).toContainEqual(change(a.scopeId, ['query']));
  });
  it('reloads a datasource once when multiple changed paths and aliases match one state.patch', async () => {
    const { a, transport, start } = setup(undefined, { items: source(['$state.filters', '$state.filters.kind', '$state.filters.status']) }); await start();
    await a.actionEngine.execute('patch', { scope: a, event: { kind: 'new', status: 'disabled' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query?.kind).toBe('new');
  });
  it('responds to explicit view/app dependencies only in scopes declaring those reads', async () => {
    const cross = source(['$state.query', '$viewState.query', '$appState.query']);
    cross.request.query = { local: '$state.query', view: '$viewState.query', app: '$appState.query' };
    const { environment, a, b, app, view, transport, start } = setup(undefined, { items: cross }); await start();
    const localOnly = new RuntimeScope(definition('local only'), 'fragment', environment, view); localOnly.start(); await flush(); transport.mockClear();
    await view.actionEngine.execute('setQuery', { scope: view, event: { value: 'shared view' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(3);
    expect(transport.mock.calls.map(([request]) => request.query?.local).filter(Boolean).sort()).toEqual(['A', 'B']);
    expect(transport.mock.calls.filter(([request]) => request.query?.local).every(([request]) => request.query?.view === 'shared view')).toBe(true);
    transport.mockClear();
    await app.actionEngine.execute('setQuery', { scope: app, event: { value: 'shared app' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(3);
    expect(transport.mock.calls.filter(([request]) => request.query?.local).every(([request]) => request.query?.app === 'shared app')).toBe(true);
    expect(environment.dependencyGraph.affected([change(a.scopeId, ['query'])])).toEqual([{ scopeId: a.scopeId, sourceId: 'items' }]);
    expect(a.scopeId).not.toBe(b.scopeId);
  });
  it('resolves nested-fragment requests locally, owning-view reads explicitly, and encoded path templates safely', async () => {
    const { environment, a, view, transport } = setup();
    const nestedSource = source(['$state.query', '$viewState.query']);
    nestedSource.request = { method: 'POST', path: '/api/$state.query', params: { ancestor: '$appState.query' }, query: { view: '$viewState.query' }, body: { local: '$state.query' } };
    const nested = new RuntimeScope(definition('nested/a b', { items: nestedSource }), 'fragment', environment, a);
    nested.start(); await flush();
    expect(transport.mock.calls[0][0]).toMatchObject({ path: '/api/nested%2Fa%20b', params: { ancestor: 'app' }, query: { view: 'view' }, body: { local: 'nested/a b' } });
    transport.mockClear();
    await a.actionEngine.execute('setQuery', { scope: a, event: { value: 'parent fragment changed' } }); await flush(); expect(transport).not.toHaveBeenCalled();
    await view.actionEngine.execute('setQuery', { scope: view, event: { value: 'owning view changed' } }); await flush(); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('reacts to local and ancestor data dependencies without treating loading status as changed result data', async () => {
    const item = source(); const summary = source(['$data.items.data.query']); summary.load.strategy = 'manual'; summary.request.query = { local: '$data.items.data.query' };
    const ancestor = source(['$viewData.items.data.query', '$appData.items.data.query']); ancestor.load.strategy = 'manual'; ancestor.request.query = { view: '$viewData.items.data.query', app: '$appData.items.data.query' };
    const { app, view, a, b, data, transport, start } = setup(undefined, { items: item, summary, ancestor }); await start();
    await a.actionEngine.execute('setQuery', { scope: a, event: { value: 'A result' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(2); expect(data(a, 'summary').data).toMatchObject({ query: undefined });
    expect(transport.mock.calls.some(([request]) => request.query?.local === 'A result')).toBe(true);
    transport.mockClear();
    await view.actionEngine.execute('setQuery', { scope: view, event: { value: 'view result' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(3); expect(data(b, 'ancestor').status).toBe('success');
    transport.mockClear();
    await app.actionEngine.execute('setQuery', { scope: app, event: { value: 'app result' } }); await flush(); expect(transport).toHaveBeenCalledTimes(3);
  });
  it('ignores unrelated, unchanged, stale and schema-metadata-only updates', async () => {
    const { a, environment, transport, start } = setup(); await start();
    await a.actionEngine.execute('unrelated'); await a.actionEngine.execute('setQuery', { event: { value: 'A' } });
    const before = environment.store.getState();
    environment.store.dispatch(runtimeActions.set({ scope: 'fragment', instance: 'missing', target: 'query', value: 'stale' }));
    expect(getChangedPaths(before, environment.store.getState())).toEqual([]);
    expect(getChangedPaths(before, { ...before, schemaFragments: { ...before.schemaFragments } })).toEqual([]);
    await flush(); expect(transport).not.toHaveBeenCalled();
  });
  it('emits scoped fragment paths once per patch and detects fragment initialization/disposal', () => {
    const observer = vi.fn(); const { store } = createRuntimeStore(observer);
    const before = store.getState();
    store.dispatch(runtimeActions.initialize({ scope: 'fragment', instance: 'A', initialState: { filters: { kind: 'old', status: 'active' } }, data: {} }));
    expect(getChangedPaths(before, store.getState())).toEqual([change('A', []), change('A', [], 'data')]);
    observer.mockClear();
    store.dispatch(runtimeActions.patch({ scope: 'fragment', instance: 'A', target: 'filters', value: { kind: 'new', status: 'disabled' } }));
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observer.mock.calls[0][0]).toEqual([change('A', ['filters', 'kind']), change('A', ['filters', 'status'])]);
    const initialized = store.getState(); store.dispatch(runtimeActions.disposeScope({ scope: 'fragment', instance: 'A' }));
    expect(getChangedPaths(initialized, store.getState())).toEqual([change('A', []), change('A', [], 'data')]);
  });
});

describe('scoped request lifecycle and registration cleanup', () => {
  it.each(['reload', 'invalidate', 'dispose'] as const)('cancels only A/items on %s and rejects old completions even if transport ignores abort', async operation => {
    const oldA = deferred(); const pendingB = deferred(); const newA = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => oldA.promise).mockImplementationOnce(() => pendingB.promise).mockImplementationOnce(() => newA.promise);
    const manual = source(); manual.load.strategy = 'manual';
    const { a, b, data, environment } = setup(transport, { items: manual }); a.start(); b.start();
    const runA = a.dataSources.reload('items'); const runB = b.dataSources.reload('items');
    let replacement: Promise<void> | undefined;
    if (operation === 'reload') replacement = a.dataSources.reload('items');
    else if (operation === 'invalidate') a.dataSources.invalidate('items'); else a.dispose();
    expect(transport.mock.calls[0][1].aborted).toBe(true); expect(transport.mock.calls[1][1].aborted).toBe(false);
    oldA.resolve({ query: 'obsolete' }); await runA;
    if (operation === 'reload') expect(data(a)).toMatchObject({ status: 'loading', data: null });
    if (operation === 'invalidate') expect(data(a)).toEqual({ status: 'idle', loading: false, data: null, error: null });
    if (operation === 'dispose') expect(environment.store.getState().fragments[a.scopeId]).toBeUndefined();
    pendingB.resolve({ query: 'B result' }); await runB; expect(data(b).data).toEqual({ query: 'B result' });
    if (replacement) { newA.resolve({ query: 'current A' }); await replacement; expect(data(a).data).toEqual({ query: 'current A' }); }
  });
  it('cancels a dependency request immediately and debounces independently per scope using the latest state', async () => {
    vi.useFakeTimers(); const oldA = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => oldA.promise).mockImplementation(async request => ({ query: request.query?.query }));
    const { a, b, data } = setup(transport, { items: source(undefined, 150) });
    a.start(); b.start(); await flush(); expect(transport).toHaveBeenCalledTimes(2);
    await a.actionEngine.execute('setQuery', { event: { value: 'first A' } });
    await b.actionEngine.execute('setQuery', { event: { value: 'latest B' } });
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    oldA.resolve({ query: 'obsolete A' }); await flush(); expect(data(a).data).toBeNull();
    await vi.advanceTimersByTimeAsync(60);
    await a.actionEngine.execute('setQuery', { event: { value: 'latest A' } });
    await vi.advanceTimersByTimeAsync(90); expect(transport).toHaveBeenCalledTimes(3);
    expect(transport.mock.calls[2][0].query?.query).toBe('latest B');
    await vi.advanceTimersByTimeAsync(60); expect(transport).toHaveBeenCalledTimes(4);
    expect(transport.mock.calls[3][0].query?.query).toBe('latest A'); expect(data(a).data).toEqual({ query: 'latest A' });
  });
  it('invalidation clears only the owned debounce timer while another scope still reloads', async () => {
    vi.useFakeTimers(); const { a, b, transport, start } = setup(undefined, { items: source(undefined, 100) }); await start();
    await a.actionEngine.execute('setQuery', { event: { value: 'A pending' } });
    await b.actionEngine.execute('setQuery', { event: { value: 'B pending' } });
    a.dataSources.invalidate('items'); await vi.advanceTimersByTimeAsync(100);
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query?.query).toBe('B pending');
  });
  it('removes descendant registrations/timers on view disposal while preserving application-owned fragments', async () => {
    vi.useFakeTimers(); const { app, view, a, b, environment, transport, start } = setup(undefined, { items: source(undefined, 100) }); await start();
    const navigation = new RuntimeScope(definition('navigation', { items: source(undefined, 100) }), 'fragment', environment, app); navigation.start(); await flush(); transport.mockClear();
    await a.actionEngine.execute('setQuery', { event: { value: 'pending A' } }); await b.actionEngine.execute('setQuery', { event: { value: 'pending B' } });
    await navigation.actionEngine.execute('setQuery', { event: { value: 'pending navigation' } });
    view.dispose();
    expect(environment.dependencyGraph.registrations().map(entry => entry.target.scopeId).sort()).toEqual([app.scopeId, navigation.scopeId].sort());
    await vi.advanceTimersByTimeAsync(100); expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0].query?.query).toBe('pending navigation');
    app.dispose(); expect(environment.dependencyGraph.registrations()).toEqual([]);
  });
  it('aborts descendant requests on parent disposal and ignores late errors in a new activation', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { a, b, view, app, environment } = setup(transport); a.start(); b.start();
    view.dispose(); const replacementView = new RuntimeScope(definition('replacement view'), 'view', environment, app);
    const replacement = new RuntimeScope(definition('replacement'), 'fragment', environment, replacementView);
    const before = environment.store.getState();
    expect(transport.mock.calls.every(([, signal]) => signal.aborted)).toBe(true);
    pending.reject(new Error('late failure')); await flush();
    expect(environment.store.getState()).toBe(before); expect(environment.store.getState().fragments[replacement.scopeId].data.items.status).toBe('idle');
  });
  it('keeps previous successful data on an error and resolves a safe error for an unavailable request path', async () => {
    const transport = vi.fn<ApiTransport>().mockResolvedValueOnce({ query: 'saved' }).mockRejectedValueOnce(new Error('Unavailable'));
    const { a, data } = setup(transport); a.start(); await flush();
    await a.dataSources.reload('items');
    expect(data(a)).toEqual({ status: 'error', loading: false, data: { query: 'saved' }, error: 'Unavailable' });
    a.dataSourceDefinitions.items.request.path = '/api/$state.missing';
    await a.dataSources.reload('items');
    expect(data(a)).toMatchObject({ status: 'error', data: { query: 'saved' } });
    expect(data(a).error).toContain('Unresolved request path'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('does not replace an active view or leave graph/state debris when a new scope has a datasource cycle', () => {
    const { app, view, environment } = setup(); const before = environment.store.getState(); const registrations = environment.dependencyGraph.registrations(); const scopes = environment.listScopes();
    expect(() => new RuntimeScope(definition('bad', { items: source(['$data.items.data']) }), 'view', environment, app)).toThrow('Circular');
    expect(environment.store.getState()).toBe(before); expect(environment.dependencyGraph.registrations()).toEqual(registrations);
    expect(environment.listScopes()).toEqual(scopes); expect(view.active()).toBe(true);
    expect(() => new RuntimeScope(definition('duplicate app'), 'application', environment)).toThrow('already has an application');
    expect(environment.dependencyGraph.registrations()).toEqual(registrations); expect(environment.store.getState()).toBe(before);
  });
  it('updates shared-ancestor registrations when a standalone view adopts the explicit application', async () => {
    const transport = vi.fn<ApiTransport>(async request => ({ query: request.query?.query }));
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
    const cross = source(['$appState.query']); cross.request.query = { query: '$appState.query' };
    const view = new RuntimeScope(definition('standalone', { items: cross }), 'view', environment); const bootstrap = view.applicationScope; roots.push(bootstrap);
    const child = new RuntimeScope(definition('child', { items: cross }), 'fragment', environment, view);
    view.start(); child.start(); await flush(); transport.mockClear();
    const app = new RuntimeScope(definition('explicit app'), 'application', environment); roots.push(app); await flush();
    expect(view.parentScope).toBe(app); expect(child.applicationScope).toBe(app);
    expect(transport).toHaveBeenCalledTimes(2); expect(transport.mock.calls.every(([request]) => request.query?.query === 'explicit app')).toBe(true);
    const paths = environment.dependencyGraph.registrations().flatMap(entry => entry.paths);
    expect(paths.some(path => path.scopeId === bootstrap.scopeId)).toBe(false);
    expect(environment.dependencyGraph.affected([change(app.scopeId, ['query'])])).toEqual([
      { scopeId: view.scopeId, sourceId: 'items' }, { scopeId: child.scopeId, sourceId: 'items' }, { scopeId: app.scopeId, sourceId: 'items' },
    ]);
  });
  it.each(['manual', undefined] as const)('preserves a %s reload policy while allowing explicit local reload', async reload => {
    const item = source(); item.load.reload = reload;
    const { a, transport, start } = setup(undefined, { items: item }); await start();
    await a.actionEngine.execute('setQuery', { event: { value: 'manual query' } }); await flush(); expect(transport).not.toHaveBeenCalled();
    await a.dataSources.reload('items'); expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query?.query).toBe('manual query');
  });
  it('does not fetch before start; a manual init strategy can still opt into dependency reloads', async () => {
    const item = source(); item.load.strategy = 'manual';
    const { a, transport } = setup(undefined, { items: item });
    await a.actionEngine.execute('setQuery', { event: { value: 'before start' } }); await flush(); expect(transport).not.toHaveBeenCalled();
    a.start(); a.start(); await flush(); expect(transport).not.toHaveBeenCalled();
    await a.actionEngine.execute('setQuery', { event: { value: 'after start' } }); await flush(); expect(transport).toHaveBeenCalledTimes(1);
  });
});
