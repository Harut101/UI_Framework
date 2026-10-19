import { afterEach, describe, expect, it, vi } from 'vitest';
import { shallowEqual } from 'react-redux';
import { ExpressionResolver, getPath, setPath } from '../src/runtime/binding/ExpressionResolver';
import { BindingEngine } from '../src/runtime/binding/BindingEngine';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { ComponentBinder } from '../src/runtime/rendering/ComponentBinder';
import { ActionRegistry } from '../src/runtime/actions/ActionRegistry';
import { DependencyGraph } from '../src/runtime/datasource/DependencyGraph';
import { getChangedPaths } from '../src/runtime/redux/changedPaths';
import { createRuntimeStore } from '../src/runtime/redux/createRuntimeStore';
import { runtimeActions } from '../src/runtime/redux/runtimeActions';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import { createComponentRegistry } from '../src/components/registry';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { ComponentDefinition, DataSourceDefinition, RuntimeState, ViewDefinition } from '../src/runtime/shared/types';

const resolver = new ExpressionResolver();
const emptyState = (): RuntimeState => ({ fragments: {}, applicationInstance: null, schemaFragments: {}, appState: {}, appData: {}, viewState: {}, viewData: {}, viewInstance: null });
function definition(debounceMs = 0): ViewDefinition {
  return {
    id: 'infrastructure', title: 'Infrastructure',
    initialState: { filters: { module: 'all', query: '' }, unrelated: false },
    dataSources: { reports: {
      type: 'api', request: { method: 'GET', path: '/api/items', query: { module: '$state.filters.module', query: '$state.filters.query' } },
      dependsOn: ['$state.filters.module', '$state.filters.query'],
      load: { strategy: 'onViewInit', reload: 'onDependencyChange', debounceMs },
    } },
    actions: {
      setModule: { type: 'state.set', target: 'filters.module', value: '$event.value' },
      setQuery: { type: 'state.set', target: 'filters.query', value: '$event.value' },
      patchFilters: { type: 'state.patch', target: 'filters', value: { module: '$event.module', query: '$event.query' } },
      replaceFilters: { type: 'state.set', target: 'filters', value: { module: 'all', query: 'changed' } },
      unrelated: { type: 'state.set', target: 'unrelated', value: true },
      reload: { type: 'datasource.reload', source: 'reports' },
      invalidate: { type: 'datasource.invalidate', source: 'reports' },
    }, root: { id: 'root', type: 'page' },
  };
}
const runtimes: (ViewRuntime | ApplicationRuntime)[] = [];
afterEach(() => { runtimes.splice(0).forEach(runtime => runtime.dispose()); vi.useRealTimers(); });
function setup(view = definition(), transport = vi.fn<ApiTransport>(async () => ({ items: [] }))) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const runtime = new ViewRuntime(view, environment);
  runtimes.push(runtime);
  return { runtime, environment, transport };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); }
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('ExpressionResolver and BindingEngine contracts', () => {
  it('rejects empty path segments and never reads inherited properties', () => {
    const state = { ...emptyState(), viewState: Object.create({ inherited: { value: 'hidden' } }) as Record<string, unknown> };
    expect(resolver.resolve('$state.inherited.value', { state })).toBeUndefined();
    for (const path of ['$state.', '$state..value', '$state.value.', '$event.constructor', '$response.__proto__']) {
      expect(() => resolver.resolve(path, { state })).toThrow('Unsafe');
    }
    expect(resolver.resolve('$state', { state })).toBe(state.viewState);
  });
  it('creates own branches when setting a nested path, without mutating inherited objects', () => {
    const inherited = { value: 'original' };
    const target = Object.create({ settings: inherited }) as Record<string, unknown>;
    setPath(target, 'settings.value', 'new');
    expect(getPath(target, 'settings.value')).toBe('new');
    expect(inherited.value).toBe('original');
    expect(() => setPath(target, 'constructor.prototype.value', true)).toThrow('Unsafe');
  });
  it('falls back for null/missing paths while preserving false, zero, and empty strings', () => {
    const state: RuntimeState = { ...emptyState(), viewState: { flag: false, count: 0, label: '' }, viewData: { reports: { status: 'idle', loading: false, data: null, error: null } } };
    const node: ComponentDefinition = { id: 'node', type: 'text', bindings: {
      items: { source: '$data.reports.data.items', default: [] }, missing: { source: '$appData.missing.data.items', default: 'fallback' },
      flag: { source: '$state.flag', default: true }, count: { source: '$state.count', default: 9 }, label: { source: '$state.label', default: 'fallback' },
    } };
    const engine = new BindingEngine(resolver);
    expect(engine.select(node, state)).toEqual({ items: [], missing: 'fallback', flag: false, count: 0, label: '', __visible: true });
    expect(shallowEqual(engine.select(node, state), engine.select(node, { ...state, appState: { unrelated: true } }))).toBe(true);
  });
  it('resolves visibility booleans and view/app expressions independently', () => {
    const engine = new BindingEngine(resolver);
    const state: RuntimeState = { ...emptyState(), appState: { visible: true }, viewState: { visible: false } };
    const node: ComponentDefinition = { id: 'node', type: 'text' };
    expect(engine.select({ ...node, visibility: '$state.visible' }, state).__visible).toBe(false);
    expect(engine.select({ ...node, visibility: '$appState.visible' }, state).__visible).toBe(true);
    expect(engine.select({ ...node, visibility: true }, state).__visible).toBe(true);
    expect(engine.select({ ...node, visibility: false }, state).__visible).toBe(false);
    expect(engine.select({ ...node, visibility: '$data.absent.data.visible' }, state).__visible).toBe(false);
  });
});

describe('changed paths and DependencyGraph', () => {
  const sources = definition().dataSources;
  it('matches the requested state.set example and deduplicates multi-path matches', () => {
    const graph = new DependencyGraph(sources);
    expect(graph.affected(['$state.filters.module'])).toEqual(['reports']);
    expect(graph.affected(['$state.filters.module', '$state.filters.query', '$state.filters.module'])).toEqual(['reports']);
    expect(graph.affected(['$appState.filters.module', '$state.filters.moduleName'])).toEqual([]);
    expect(graph.affected(['$state.filters'])).toEqual(['reports']);
  });
  it('matches child changes to object dependencies and isolates namespaces', () => {
    const source = sources.reports;
    const graph = new DependencyGraph({ view: { ...source, dependsOn: ['$state.filters'] }, app: { ...source, dependsOn: ['$appState.filters'] } });
    expect(graph.affected(['$state.filters.module'])).toEqual(['view']);
    expect(graph.affected(['$appState.filters.module'])).toEqual(['app']);
  });
  it('emits granular paths for all four slices and treats arrays/replacements as atomic', () => {
    const before: RuntimeState = { ...emptyState(), applicationInstance: 'app', viewInstance: 'view', appState: { a: 1 }, viewState: { filters: { module: 'all', query: '' }, values: [1] } };
    const after: RuntimeState = { ...before, appState: { a: 2 }, viewState: { filters: { module: 'finance', query: '' }, values: [2] }, appData: { global: { status: 'idle', loading: false, data: null, error: null } }, viewData: { local: { status: 'idle', loading: false, data: null, error: null } } };
    expect(getChangedPaths(before, after)).toEqual([
      { scopeId: 'app', area: 'state', path: ['a'] }, { scopeId: 'app', area: 'data', path: ['global'] },
      { scopeId: 'view', area: 'state', path: ['filters', 'module'] }, { scopeId: 'view', area: 'state', path: ['values'] },
      { scopeId: 'view', area: 'data', path: ['local'] },
    ]);
    expect(getChangedPaths(before, { ...before, viewInstance: 'token' })).toEqual([
      { scopeId: 'view', area: 'state', path: [] }, { scopeId: 'view', area: 'data', path: [] },
      { scopeId: 'token', area: 'state', path: [] }, { scopeId: 'token', area: 'data', path: [] },
    ]);
    expect(getChangedPaths(before, before)).toEqual([]);
    expect(getChangedPaths(before, { ...before, viewState: { ...before.viewState, filters: null } })).toEqual([{ scopeId: 'view', area: 'state', path: ['filters'] }]);
  });
  it('listener middleware reports reducer results once and ignores no-op/stale updates', () => {
    const observer = vi.fn();
    const { store } = createRuntimeStore(observer);
    store.dispatch(runtimeActions.initialize({ scope: 'view', instance: 'view', initialState: { filters: { module: 'all', query: '' } }, data: {} }));
    observer.mockClear();
    store.dispatch(runtimeActions.set({ scope: 'view', instance: 'view', target: 'filters.module', value: 'finance' }));
    expect(observer.mock.calls[0][0]).toEqual([{ scopeId: 'view', area: 'state', path: ['filters', 'module'] }]);
    expect(observer.mock.calls[0][1].viewState.filters.module).toBe('all');
    expect(observer.mock.calls[0][2].viewState.filters.module).toBe('finance');
    observer.mockClear();
    store.dispatch(runtimeActions.patch({ scope: 'view', instance: 'view', target: 'filters', value: { module: 'sales', query: 'open' } }));
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observer.mock.calls[0][0]).toEqual([{ scopeId: 'view', area: 'state', path: ['filters', 'module'] }, { scopeId: 'view', area: 'state', path: ['filters', 'query'] }]);
    observer.mockClear();
    store.dispatch(runtimeActions.set({ scope: 'view', instance: 'view', target: 'filters.module', value: 'sales' }));
    store.dispatch(runtimeActions.set({ scope: 'view', instance: 'stale', target: 'filters.module', value: 'ignored' }));
    expect(observer).not.toHaveBeenCalled();
  });
});

describe('datasource policy, debounce, and cancellation', () => {
  it('reloads once for multiple dependencies changed by a named state.patch', async () => {
    const { runtime, transport, environment } = setup(); runtime.start(); await settle();
    await runtime.actionEngine.execute('patchFilters', { event: { module: 'sales', query: 'open' } });
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].query).toEqual({ module: 'sales', query: 'open' });
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ kind: 'dependency', detail: '$state.filters.module, $state.filters.query' }));
  });
  it('debounces rapid changes once per datasource and resolves the latest request state', async () => {
    vi.useFakeTimers();
    const { runtime, transport } = setup(definition(100)); runtime.start(); await settle();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } });
    await vi.advanceTimersByTimeAsync(70);
    await runtime.actionEngine.execute('setQuery', { event: { value: 'latest' } });
    await runtime.actionEngine.execute('unrelated');
    await vi.advanceTimersByTimeAsync(99); expect(transport).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].query).toEqual({ module: 'sales', query: 'latest' });
    await vi.advanceTimersByTimeAsync(500); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('cancels in-flight work immediately during debounce and rejects stale success and error', async () => {
    vi.useFakeTimers();
    const first = deferred(); const second = deferred(); const third = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise).mockImplementationOnce(() => third.promise);
    const { runtime, environment } = setup(definition(100), transport); runtime.start();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } });
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    first.resolve({ items: ['obsolete'] }); await settle();
    expect(environment.store.getState().viewData.reports.data).toBeNull();
    await vi.advanceTimersByTimeAsync(100);
    await runtime.actionEngine.execute('setModule', { event: { value: 'finance' } });
    expect(transport.mock.calls[1][1].aborted).toBe(true);
    second.reject(new Error('Obsolete error')); await settle();
    expect(environment.store.getState().viewData.reports.error).toBeNull();
    await vi.advanceTimersByTimeAsync(100); third.resolve({ items: ['current'] }); await settle();
    expect(environment.store.getState().viewData.reports).toMatchObject({ status: 'success', loading: false, data: { items: ['current'] }, error: null });
  });
  it('explicit reload bypasses debounce and cancels a queued automatic reload', async () => {
    vi.useFakeTimers();
    const { runtime, transport } = setup(definition(100)); runtime.start(); await settle();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } });
    await runtime.actionEngine.execute('reload'); expect(transport).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(500); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('invalidation and disposal clear queued debounce timers', async () => {
    vi.useFakeTimers();
    const { runtime, transport, environment } = setup(definition(100)); runtime.start(); await settle();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } });
    await runtime.actionEngine.execute('invalidate');
    await vi.advanceTimersByTimeAsync(200); expect(transport).toHaveBeenCalledTimes(1);
    expect(environment.store.getState().viewData.reports).toEqual({ status: 'idle', loading: false, data: null, error: null });
    await runtime.actionEngine.execute('setModule', { event: { value: 'finance' } });
    runtime.dispose();
    await vi.advanceTimersByTimeAsync(200); expect(transport).toHaveBeenCalledTimes(1);
    expect(environment.store.getState().viewData).toEqual({});
  });
  it('applies independent debounce delays to multiple affected datasources', async () => {
    vi.useFakeTimers();
    const view = definition(100);
    view.dataSources.summary = { ...view.dataSources.reports, load: { strategy: 'manual', reload: 'onDependencyChange', debounceMs: 200 } };
    const { runtime, transport } = setup(view); runtime.start(); await settle();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } });
    await vi.advanceTimersByTimeAsync(100); expect(transport).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(100); expect(transport).toHaveBeenCalledTimes(3);
  });
  it('honors manual reload policy and does not confuse initial-load policy with reload policy', async () => {
    const view = definition(); view.dataSources.reports.load.reload = 'manual';
    const { runtime, transport } = setup(view); runtime.start(); await settle();
    await runtime.actionEngine.execute('setModule', { event: { value: 'sales' } }); expect(transport).toHaveBeenCalledTimes(1);
    await runtime.actionEngine.execute('reload'); expect(transport).toHaveBeenCalledTimes(2);
    const manual = definition(); manual.dataSources.reports.load.strategy = 'manual';
    const second = setup(manual); second.runtime.start(); expect(second.transport).not.toHaveBeenCalled();
    await second.runtime.actionEngine.execute('setModule', { event: { value: 'sales' } }); expect(second.transport).toHaveBeenCalledTimes(1);
  });
  it('avoids reloading an unchanged leaf when its parent object is replaced', async () => {
    const view = definition(); view.dataSources.reports.dependsOn = ['$state.filters.module'];
    const { runtime, transport } = setup(view); runtime.start(); await settle();
    await runtime.actionEngine.execute('replaceFilters'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('chains datasource data dependencies without reacting to unrelated loading changes', async () => {
    const view = definition();
    view.dataSources.summary = { type: 'api', request: { method: 'GET', path: '/api/summary', query: { id: '$data.reports.data.id' } }, dependsOn: ['$data.reports.data.id'], load: { strategy: 'manual', reload: 'onDependencyChange' } };
    const transport = vi.fn<ApiTransport>(async request => request.path === '/api/items' ? { id: 'a' } : { total: 3 });
    const { runtime, environment } = setup(view, transport); runtime.start(); await settle();
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].query).toEqual({ id: 'a' });
    await runtime.actionEngine.execute('reload'); await settle();
    expect(transport).toHaveBeenCalledTimes(3);
    expect(environment.store.getState().viewData.summary.data).toEqual({ total: 3 });
  });
  it.each([-1, NaN, Infinity, 2_147_483_648])('rejects invalid debounce delay %s during schema validation', delay => {
    const view = definition(delay);
    expect(() => validateViewDefinition(view, createComponentRegistry())).toThrow('debounceMs');
  });
});

describe('application/view scope and generic action boundaries', () => {
  it('component and action registries resolve only registered implementations', () => {
    const Component = () => null;
    const registry = new ComponentRegistry().register('isolated', Component);
    expect(registry.get('isolated')).toBe(Component);
    expect(registry.has('missing')).toBe(false);
    expect(() => registry.get('missing')).toThrow('Unknown component');
    const handler = vi.fn();
    const actions = new ActionRegistry().register('state.set', handler);
    expect(() => actions.get('state.patch')).toThrow('Unregistered action');
  });
  it('ComponentBinder routes named callback failures to runtime diagnostics and notification', async () => {
    const { runtime, environment } = setup();
    const props = new ComponentBinder().bind({ id: 'button', type: 'button', props: { label: 'Click' }, handlers: { onClick: { action: 'missing' } } }, runtime.actionEngine);
    (props.onClick as (event: unknown) => void)({ value: 'payload' }); await settle();
    expect(props.label).toBe('Click');
    expect(environment.notify).toHaveBeenCalledWith('Unknown named action: missing', 'error');
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ kind: 'error', label: 'missing' }));
  });
  it('keeps identically named state/actions/datasources separate and preserves app data on view disposal', async () => {
    const { runtime: view, environment, transport } = setup();
    const appSource: DataSourceDefinition = { ...definition().dataSources.reports, request: { method: 'GET', path: '/api/global', query: { module: '$appState.filters.module' } }, dependsOn: ['$appState.filters.module'], load: { strategy: 'onAppInit', reload: 'onDependencyChange' } };
    const app = new ApplicationRuntime({ ...definition(), dataSources: { reports: appSource }, shell: { id: 'shell', type: 'page' }, viewSource: { request: { path: "/api/ui/views" } } }, environment); runtimes.push(app);
    app.start(); view.start(); await settle(); expect(transport).toHaveBeenCalledTimes(2);
    await app.actionEngine.execute('setModule', { event: { value: 'global' } }); await settle();
    expect(transport).toHaveBeenCalledTimes(3);
    expect(environment.store.getState().appState.filters).toMatchObject({ module: 'global' });
    expect(environment.store.getState().viewState.filters).toMatchObject({ module: 'all' });
    await view.actionEngine.execute('setModule', { event: { value: 'local' } }); await settle();
    expect(transport).toHaveBeenCalledTimes(4);
    expect(transport.mock.calls[2][0].path).toBe('/api/global');
    expect(transport.mock.calls[3][0].path).toBe('/api/items');
    const appData = environment.store.getState().appData;
    view.dispose();
    expect(environment.store.getState().appData).toBe(appData);
    expect(environment.store.getState().viewState).toEqual({});
    await app.actionEngine.execute('setModule', { event: { value: 'after-view' } }); expect(transport).toHaveBeenCalledTimes(5);
  });
  it('rejects inherited named actions and datasource names', async () => {
    const { runtime } = setup();
    await expect(runtime.actionEngine.execute('toString')).rejects.toThrow('Unknown named action');
    await expect(runtime.dataSources.reload('constructor')).rejects.toThrow('Unknown datasource');
  });
  it('lets sequence steps use the previous API response and current Redux state', async () => {
    const view = definition();
    view.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/save' } };
    view.actions.capture = { type: 'state.set', target: 'savedId', value: '$response.id' };
    view.actions.notice = { type: 'notification.show', message: '$state.savedId' };
    view.actions.flow = { type: 'sequence', actions: ['save', 'capture', 'notice'] };
    const { runtime, environment } = setup(view, vi.fn<ApiTransport>(async () => ({ id: 'saved' })));
    await runtime.actionEngine.execute('flow');
    expect(environment.store.getState().viewState.savedId).toBe('saved');
    expect(environment.notify).toHaveBeenCalledWith('saved', 'info');
  });
  it('propagates a failed success action without invoking the API error callback', async () => {
    const view = definition();
    view.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/save' }, onSuccess: 'missing', onError: 'errorNotice' };
    view.actions.errorNotice = { type: 'notification.show', message: 'HTTP failed', tone: 'error' };
    const { runtime, environment } = setup(view);
    await expect(runtime.actionEngine.execute('save')).rejects.toThrow('Unknown named action');
    expect(environment.notify).not.toHaveBeenCalled();
  });
});

