import { afterEach, describe, expect, it, vi } from 'vitest';
import { shallowEqual } from 'react-redux';
import { ExpressionResolver, getPath } from '../src/runtime/binding/ExpressionResolver';
import { BindingEngine } from '../src/runtime/binding/BindingEngine';
import { ComponentBinder } from '../src/runtime/rendering/ComponentBinder';
import { DependencyGraph } from '../src/runtime/datasource/DependencyGraph';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { createComponentRegistry } from '../src/components/registry';
import { validateApplicationDefinition, validateViewDefinition } from '../src/runtime/shared/validation';
import { applicationDefinition } from '../src/schemas';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { ComponentDefinition, DataSourceDefinition, RuntimeState, ViewDefinition } from '../src/runtime/shared/types';

const source: DataSourceDefinition = { type: 'api', request: { method: 'GET', path: '/api/items', query: { filter: '$state.filters.module' } }, dependsOn: ['$state.filters.module'], load: { strategy: 'onViewInit', reload: 'onDependencyChange' } };
function fixture(): ViewDefinition {
  return { id: 'test', title: 'Test', initialState: { filters: { module: 'all', query: '' }, unrelated: false }, dataSources: { items: structuredClone(source) }, actions: {
    select: { type: 'state.set', target: 'filters.module', value: '$event.value' },
    unrelated: { type: 'state.set', target: 'unrelated', value: true },
    reset: { type: 'state.patch', target: 'filters', value: { module: 'all' } },
    reload: { type: 'datasource.reload', source: 'items' },
    invalidate: { type: 'datasource.invalidate', source: 'items' },
    notify: { type: 'notification.show', message: '$event.value', tone: 'success' },
    go: { type: 'navigate', to: '$event.value' },
    sequence: { type: 'sequence', actions: ['select', 'notify'] },
  }, root: { id: 'root', type: 'page', bindings: { items: { source: '$data.items.data.items', default: [] }, selectedId: '$state.filters.module' }, handlers: { onSelect: { action: 'select' } } } };
}

const scopeApplication = { ...applicationDefinition, initialState: { compact: false, slowRequests: false }, actions: {
  setCompact: { type: 'state.set' as const, target: 'compact', value: '$event.value' },
  setSlowRequests: { type: 'state.set' as const, target: 'slowRequests', value: '$event.value' },
} };
const nextViewDefinition: ViewDefinition = { ...fixture(), id: 'next' };

const runtimes: (ViewRuntime | ApplicationRuntime)[] = [];
afterEach(() => { runtimes.splice(0).forEach(runtime => runtime.dispose()); });
function setup(transport: ApiTransport = vi.fn(async () => ({ items: [] })), definition = fixture()) {
  const navigate = vi.fn(); const notify = vi.fn();
  const environment = new RuntimeEnvironment(navigate, notify, transport);
  const runtime = new ViewRuntime(definition, environment); runtimes.push(runtime);
  return { environment, runtime, transport, navigate, notify };
}
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('safe expressions and bindings', () => {
  const resolver = new ExpressionResolver();
  const state: RuntimeState = { fragments: {}, applicationInstance: null, schemaFragments: {}, appState: { compact: true }, appData: { health: { status: 'success', loading: false, data: { ok: true }, error: null } }, viewState: { selected: 'x' }, viewData: { items: { status: 'idle', loading: false, data: null, error: null } }, viewInstance: 'test' };
  it('resolves every namespace and nested request objects', () => {
    expect(resolver.resolve({ a: '$appState.compact', b: '$appData.health.data.ok', c: '$state.selected', d: '$data.items.loading', e: '$event.value', f: '$response.id' }, { state, event: { value: 4 }, response: { id: 7 } })).toEqual({ a: true, b: true, c: 'x', d: false, e: 4, f: 7 });
  });
  it('handles null data and missing paths without throwing', () => {
    expect(resolver.resolve('$data.items.data.items', { state })).toBeUndefined();
    expect(getPath(null, 'deep.path')).toBeUndefined();
  });
  it('rejects prototype access and unknown namespaces', () => {
    expect(() => resolver.resolve('$state.__proto__.polluted', { state })).toThrow('Unsafe');
    expect(() => resolver.resolve('$state.constructor', { state })).toThrow('Unsafe');
    expect(() => resolver.resolve('$javascript.alert', { state })).toThrow('Unknown');
  });
  it('uses stable defaults and preserves false values', () => {
    const engine = new BindingEngine(resolver);
    const node: ComponentDefinition = { id: 'list', type: 'record-list', bindings: { items: { source: '$data.items.data.items', default: [] }, loading: { source: '$data.items.loading', default: true } }, visibility: '$appState.compact' };
    const selected = engine.select(node, state);
    expect(selected.items).toEqual([]); expect(selected.loading).toBe(false); expect(selected.__visible).toBe(true);
    expect(shallowEqual(selected, engine.select(node, { ...state, viewState: { unrelated: 'change' } }))).toBe(true);
  });
  it('visibility is resolved independently of datasource dependencies', () => {
    const engine = new BindingEngine(resolver);
    expect(engine.select({ id: 'x', type: 'text', visibility: '$state.absent' }, state).__visible).toBe(false);
  });
});

describe('named generic actions', () => {
  it('ComponentBinder merges ordinary static props and callbacks', async () => {
    const { runtime, environment } = setup();
    const props = new ComponentBinder().bind({ ...fixture().root, props: { caption: 'Items' } }, runtime.actionEngine);
    expect(props.caption).toBe('Items');
    (props.onSelect as (event: unknown) => void)({ value: 'sales' });
    await flush(); expect(environment.store.getState().viewState.filters).toEqual({ module: 'sales', query: '' });
  });
  it('patches nested state without losing siblings', async () => {
    const { runtime, environment } = setup();
    await runtime.actionEngine.execute('select', { event: { value: 'sales' } });
    await runtime.actionEngine.execute('reset');
    expect(environment.store.getState().viewState.filters).toEqual({ module: 'all', query: '' });
  });
  it('runs ordered named sequences, navigation, and notifications', async () => {
    const { runtime, environment, navigate, notify } = setup();
    await runtime.actionEngine.execute('sequence', { event: { value: 'sales' } });
    expect(environment.store.getState().viewState.filters).toMatchObject({ module: 'sales' });
    expect(notify).toHaveBeenCalledWith('sales', 'success');
    await runtime.actionEngine.execute('go', { event: { value: '/people' } });
    expect(navigate).toHaveBeenCalledWith('/people');
  });
  it('resolves API bodies and $response for chained actions', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ id: 42, message: 'Saved' }));
    const definition = fixture();
    definition.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/save', body: { module: '$state.filters.module' } }, target: 'saved', onSuccess: 'savedNotice' };
    definition.actions.savedNotice = { type: 'notification.show', message: '$response.message' };
    const { runtime, environment, notify } = setup(transport, definition);
    await runtime.actionEngine.execute('save');
    expect(transport.mock.calls[0][0].body).toEqual({ module: 'all' });
    expect(environment.store.getState().viewState.saved).toMatchObject({ id: 42 });
    expect(notify).toHaveBeenCalledWith('Saved', 'info');
  });
  it('routes action API errors to a named error action', async () => {
    const definition = fixture();
    definition.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/save' }, onError: 'errorNotice' };
    definition.actions.errorNotice = { type: 'notification.show', message: '$response.error', tone: 'error' };
    const { runtime, notify } = setup(async () => { throw new Error('Unavailable'); }, definition);
    await runtime.actionEngine.execute('save');
    expect(notify).toHaveBeenCalledWith('Unavailable', 'error');
  });
  it('rejects missing actions and recursive sequences', async () => {
    const definition = fixture(); definition.actions.loop = { type: 'sequence', actions: ['loop'] };
    const { runtime } = setup(undefined, definition);
    await expect(runtime.actionEngine.execute('missing')).rejects.toThrow('Unknown named');
    await expect(runtime.actionEngine.execute('loop')).rejects.toThrow('Circular');
  });
});

describe('datasource lifecycle and listener middleware', () => {
  it('creates idle entries before load and resolves the initial request', async () => {
    const transport = vi.fn(async () => ({ items: [1] }));
    const { runtime, environment } = setup(transport);
    expect(environment.store.getState().viewData.items).toEqual({ status: 'idle', loading: false, data: null, error: null });
    runtime.start(); runtime.start();
    expect(environment.store.getState().viewData.items.status).toBe('loading');
    await flush(); expect(environment.store.getState().viewData.items.data).toEqual({ items: [1] });
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('reloads only declared dependencies with current state', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ items: [] }));
    const { runtime } = setup(transport); runtime.start(); await flush();
    await runtime.actionEngine.execute('unrelated'); expect(transport).toHaveBeenCalledTimes(1);
    await runtime.actionEngine.execute('select', { event: { value: 'finance' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].query).toEqual({ filter: 'finance' });
    await runtime.actionEngine.execute('select', { event: { value: 'finance' } }); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('cancels replaced requests and prevents stale successes', async () => {
    const first = deferred<unknown>(); const second = deferred<unknown>();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const { runtime, environment } = setup(transport); runtime.start();
    await runtime.actionEngine.execute('select', { event: { value: 'sales' } });
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    second.resolve({ items: ['new'] }); await flush();
    first.resolve({ items: ['stale'] }); await flush();
    expect(environment.store.getState().viewData.items.data).toEqual({ items: ['new'] });
  });
  it('retains previous data on load and error, then recovers', async () => {
    const transport = vi.fn<ApiTransport>().mockResolvedValueOnce({ items: [1] }).mockRejectedValueOnce(new Error('Failed')).mockResolvedValueOnce({ items: [2] });
    const { runtime, environment } = setup(transport); runtime.start(); await flush();
    const reload = runtime.actionEngine.execute('reload');
    expect(environment.store.getState().viewData.items).toMatchObject({ status: 'loading', data: { items: [1] } });
    await reload; expect(environment.store.getState().viewData.items).toMatchObject({ status: 'error', loading: false, error: 'Failed', data: { items: [1] } });
    await runtime.actionEngine.execute('reload'); expect(environment.store.getState().viewData.items).toMatchObject({ status: 'success', error: null, data: { items: [2] } });
  });
  it('invalidation aborts in-flight work and restores idle', async () => {
    const pending = deferred<unknown>(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { runtime, environment } = setup(transport); runtime.start();
    await runtime.actionEngine.execute('invalidate');
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    expect(environment.store.getState().viewData.items.status).toBe('idle');
    pending.resolve({ items: [1] }); await flush(); expect(environment.store.getState().viewData.items.data).toBeNull();
  });
  it('keeps manual datasources idle until explicit reload', async () => {
    const definition = fixture(); definition.dataSources.items.load.strategy = 'manual';
    const transport = vi.fn<ApiTransport>(async () => ({})); const { runtime } = setup(transport, definition);
    runtime.start(); expect(transport).not.toHaveBeenCalled();
    await runtime.actionEngine.execute('reload'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('rejects datasource dependency cycles', () => {
    expect(() => new DependencyGraph({ a: { ...source, dependsOn: ['$data.b.data'] }, b: { ...source, dependsOn: ['$data.a.data'] } })).toThrow('Circular');
  });
});

describe('scope isolation and schema-only rewiring', () => {
  it('retains app state across routes and rejects disposed view requests and actions', async () => {
    const pending = deferred<unknown>(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { runtime: oldView, environment } = setup(transport); oldView.start();
    const app = new ApplicationRuntime(scopeApplication, environment); runtimes.push(app);
    await app.actionEngine.execute('setCompact', { event: { value: true } });
    oldView.dispose(); const newView = new ViewRuntime(nextViewDefinition, environment); runtimes.push(newView);
    pending.resolve({ items: ['stale'] }); await flush();
    expect(environment.store.getState().appState.compact).toBe(true);
    expect(environment.store.getState().viewState).toEqual(nextViewDefinition.initialState);
    expect(environment.store.getState().viewData.items.status).toBe('idle');
    await oldView.actionEngine.execute('select', { event: { value: 'ignored' } });
    expect(environment.store.getState().viewState.filters).toEqual({ module: 'all', query: '' });
  });
  it('reloads view sources when an app dependency changes', async () => {
    const definition = fixture(); definition.dataSources.items.dependsOn = ['$appState.slowRequests'];
    const { runtime, environment, transport } = setup(undefined, definition);
    const app = new ApplicationRuntime(scopeApplication, environment); runtimes.push(app);
    runtime.start(); await flush();
    await app.actionEngine.execute('setSlowRequests', { event: { value: true } }); await flush();
    expect(transport).toHaveBeenCalledTimes(2);
  });
  it('prevents action API responses from mutating a new view', async () => {
    const pending = deferred<unknown>(); const definition = fixture();
    definition.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/save' }, target: 'saved', onSuccess: 'notify' };
    const { runtime, environment, notify } = setup(() => pending.promise, definition);
    const execution = runtime.actionEngine.execute('save'); runtime.dispose();
    const next = new ViewRuntime(nextViewDefinition, environment); runtimes.push(next);
    pending.resolve({ id: 'stale' }); await execution;
    expect(environment.store.getState().viewState.saved).toBeUndefined(); expect(notify).not.toHaveBeenCalled();
  });
});

describe('schema validation', () => {
  const registry = createComponentRegistry();
  it('accepts the supplied schemas and app shell', () => {
    expect(() => validateApplicationDefinition(applicationDefinition, registry)).not.toThrow();
  });
  it('rejects inline handlers and unknown component types', () => {
    const definition = fixture(); (definition.root.handlers!.onSelect as unknown as Record<string, unknown>).type = 'state.set';
    expect(() => validateViewDefinition(definition, registry)).toThrow('named actions only');
    definition.root.handlers = {}; definition.root.type = 'unknown';
    expect(() => validateViewDefinition(definition, registry)).toThrow('Unknown component');
  });
  it('rejects broken action references and unsafe paths before application', () => {
    const definition = fixture(); definition.root.handlers!.onSelect.action = 'missing';
    expect(() => validateViewDefinition(definition, registry)).toThrow('Unknown handler');
    definition.root.handlers = {}; definition.actions.select = { type: 'state.set', target: '__proto__.polluted', value: true };
    expect(() => validateViewDefinition(definition, registry)).toThrow('Unsafe');
  });
  it('rejects cycles and invalid scope initialization strategies', () => {
    const definition = fixture(); definition.actions.loop = { type: 'sequence', actions: ['loop'] };
    expect(() => validateViewDefinition(definition, registry)).toThrow('Circular');
    delete definition.actions.loop; definition.dataSources.items.load.strategy = 'onAppInit';
    expect(() => validateViewDefinition(definition, registry)).toThrow('Invalid load strategy');
  });
});

