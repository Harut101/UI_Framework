import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { ScopeRuntime } from '../src/runtime/shared/ScopeRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { runtimeActions } from '../src/runtime/redux/runtimeActions';
import { createRuntimeStore } from '../src/runtime/redux/createRuntimeStore';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { RuntimeScopeDefinition, ViewDefinition, DataEntry } from '../src/runtime/shared/types';

function definition(id = 'shared'): RuntimeScopeDefinition {
  return {
    id, initialState: { value: 'initial', fields: { name: 'Initial', count: 0 } }, dataSources: {},
    actions: {
      set: { type: 'state.set', target: 'value', value: '$event.value' },
      patch: { type: 'state.patch', target: 'fields', value: { name: '$event.value' } },
      copyLocal: { type: 'state.set', target: 'copied', value: '$state.value' },
    },
  };
}
const environments: RuntimeEnvironment[] = [];
function setup(transport: ApiTransport = vi.fn(async () => ({ items: [] }))) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); environments.push(environment);
  const app = new ApplicationRuntime({ ...definition('application'), shell: { id: 'shell', type: 'page' }, viewSource: { request: { path: "/api/ui/views" } } }, environment);
  const viewDefinition: ViewDefinition = { ...definition('view'), title: 'View', root: { id: 'page', type: 'page' } };
  const view = new ViewRuntime(viewDefinition, environment);
  const fragment = (parent = view as RuntimeScope, schema = definition()) => new RuntimeScope(schema, 'fragment', environment, parent);
  return { environment, app, view, viewDefinition, fragment, transport };
}
afterEach(() => {
  for (const environment of environments.splice(0)) {
    environment.applicationScope?.dispose();
    for (const scope of environment.listScopes()) scope.dispose();
  }
});
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const success: DataEntry = { status: 'success', loading: false, data: { items: [1] }, error: null };

function write(scope: RuntimeScope, value: string) {
  scope.environment.store.dispatch(runtimeActions.set({ scope: scope.scope, instance: scope.scopeId, target: 'value', value }));
}

describe('RuntimeScope identity and hierarchy', () => {
  it('uses one implementation and one application store for all three scope types', () => {
    const { environment, app, view, fragment } = setup(); const child = fragment();
    expect(ScopeRuntime).toBe(RuntimeScope);
    expect(app).toBeInstanceOf(RuntimeScope); expect(view).toBeInstanceOf(RuntimeScope);
    expect([app.type, view.type, child.type]).toEqual(['application', 'view', 'fragment']);
    expect([app.environment.store, view.environment.store, child.environment.store]).toEqual([environment.store, environment.store, environment.store]);
    expect(environment.listScopes()).toEqual([app, view, child]);
    expect(environment.getScope(child.scopeId)).toBe(child);
    expect(child.instance).toBe(child.scopeId);
  });
  it('allocates unique activation identities for identical definitions, nested instances and other applications', () => {
    const { app, view, fragment } = setup(); const schema = definition();
    const first = fragment(view, schema); const second = fragment(view, schema); const nested = fragment(first, schema);
    const other = setup().fragment();
    const ids = [app, view, first, second, nested, other].map(scope => scope.scopeId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(first.definition).toBe(second.definition); expect(first.scopeId).not.toBe(second.scopeId);
    first.dispose(); expect(fragment(view, schema).scopeId).not.toBe(first.scopeId);
  });
  it('records parent, owning application and nearest owning view for nested scopes', () => {
    const { app, view, fragment } = setup(); const first = fragment(); const nested = fragment(first);
    expect(app.parentScope).toBeNull(); expect(app.parentScopeId).toBeNull();
    expect(app.applicationScope).toBe(app); expect(app.viewScope).toBeNull();
    expect(view.parentScope).toBe(app); expect(view.applicationScope).toBe(app); expect(view.viewScope).toBe(view);
    expect(nested.parentScope).toBe(first); expect(nested.parentScopeId).toBe(first.scopeId);
    expect(nested.applicationScope).toBe(app); expect(nested.applicationScopeId).toBe(app.scopeId);
    expect(nested.viewScope).toBe(view); expect(nested.viewScopeId).toBe(view.scopeId);
  });
  it('supports application-owned fragments without a view ancestor', () => {
    const { app, fragment, environment } = setup(); const navigation = fragment(app);
    expect(navigation.parentScope).toBe(app); expect(navigation.viewScope).toBeNull(); expect(navigation.viewScopeId).toBeNull();
    environment.viewScope!.dispose(); expect(navigation.active()).toBe(true);
  });
  it('rejects missing, dead, invalid or cross-environment parents without registering a child', () => {
    const { environment, app, fragment } = setup(); const foreign = setup(); const child = fragment(); child.dispose();
    const before = environment.listScopes();
    expect(() => new RuntimeScope(definition(), 'fragment', environment)).toThrow('require a parent');
    expect(() => new RuntimeScope(definition(), 'fragment', environment, child)).toThrow('Parent scope must be active');
    expect(() => new RuntimeScope(definition(), 'fragment', environment, foreign.app)).toThrow('same environment');
    expect(() => new RuntimeScope(definition(), 'view', environment, fragment())).toThrow('application parent');
    // Remove the deliberately created, valid parent used by the invalid-view case.
    environment.childScopes(environment.viewScope!).forEach(scope => scope.dispose());
    expect(() => new RuntimeScope(definition(), 'application', environment, app)).toThrow('cannot have a parent');
    expect(() => new RuntimeScope(definition(), 'application', environment)).toThrow('already has an application');
    expect(environment.listScopes()).toEqual(before);
  });
  it('preserves standalone ViewRuntime callers and promotes their bootstrap application without changing stores or view state', async () => {
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), vi.fn(async () => ({}))); environments.push(environment);
    const view = new ViewRuntime({ ...definition('standalone'), title: 'Standalone', root: { id: 'page', type: 'page' } }, environment);
    const bootstrap = view.applicationScope; const store = environment.store;
    const child = new RuntimeScope(definition(), 'fragment', environment, view);
    await view.actionEngine.execute('set', { event: { value: 'edited' } });
    const app = new ApplicationRuntime({ ...definition('real'), shell: { id: 'shell', type: 'page' }, viewSource: { request: { path: "/api/ui/views" } } }, environment);
    expect(bootstrap.active()).toBe(false); expect(environment.getScope(bootstrap.scopeId)).toBeUndefined();
    expect(view.parentScope).toBe(app); expect(child.applicationScope).toBe(app); expect(view.active()).toBe(true);
    expect(environment.store).toBe(store); expect(store.getState().viewState.value).toBe('edited');
    app.dispose(); expect(child.active()).toBe(false); expect(store.getState().fragments).toEqual({});
  });
});

describe('scoped initialization and local state', () => {
  it('clones initial state per scope and initializes datasource entries without fetching or mutating definitions', () => {
    const { fragment, environment, transport } = setup(); const schema = definition();
    schema.dataSources.items = { type: 'api', request: { method: 'GET', path: '/api/items' }, load: { strategy: 'onScopeInit' } };
    const snapshot = structuredClone(schema); const first = fragment(undefined, schema); const second = fragment(undefined, schema);
    const entries = environment.store.getState().fragments;
    expect(entries[first.scopeId]).toEqual({ state: snapshot.initialState, data: { items: { status: 'idle', loading: false, data: null, error: null } } });
    expect(entries[first.scopeId].state).not.toBe(schema.initialState);
    expect(entries[first.scopeId].state).not.toBe(entries[second.scopeId].state);
    expect(entries[first.scopeId].state.fields).not.toBe(entries[second.scopeId].state.fields);
    expect(first.stateDefinition).toBe(schema.initialState); expect(first.dataSourceDefinitions).toBe(schema.dataSources); expect(first.actionDefinitions).toBe(schema.actions);
    expect(schema).toEqual(snapshot); expect(Object.isFrozen(schema.initialState)).toBe(false); expect(transport).not.toHaveBeenCalled();
  });
  it('keeps same-named state properties, nested patches, named actions and data independent across siblings and host scopes', async () => {
    const { fragment, environment, app, view } = setup(); const a = fragment(); const b = fragment();
    const hostBefore = environment.store.getState(); const untouched = hostBefore.fragments[b.scopeId];
    await a.actionEngine.execute('set', { event: { value: 'A' } });
    await a.actionEngine.execute('patch', { event: { value: 'Alice' } });
    await a.actionEngine.execute('copyLocal');
    environment.store.dispatch(runtimeActions.dataChanged({ scope: 'fragment', instance: a.scopeId, id: 'items', entry: success }));
    const state = environment.store.getState();
    expect(state.fragments[a.scopeId]).toMatchObject({ state: { value: 'A', copied: 'A', fields: { name: 'Alice', count: 0 } }, data: { items: success } });
    expect(state.fragments[b.scopeId]).toBe(untouched);
    expect(state.viewState).toBe(hostBefore.viewState); expect(state.appState).toBe(hostBefore.appState);
    expect(state.viewData).toBe(hostBefore.viewData); expect(state.appData).toBe(hostBefore.appData);
    await b.actionEngine.execute('set', { event: { value: 'B' } }); write(app, 'application'); write(view, 'view');
    expect(environment.store.getState().fragments[a.scopeId].state.value).toBe('A');
    expect(environment.store.getState().fragments[b.scopeId].state.value).toBe('B');
  });
  it('makes initialize idempotent without resetting edits or duplicating registration', () => {
    const { fragment, environment } = setup(); const child = fragment(); write(child, 'edited');
    const state = environment.store.getState(); const scopes = environment.listScopes();
    expect(child.initialize()).toBe(child); expect(child.initialize()).toBe(child);
    environment.store.dispatch(runtimeActions.initialize({ scope: 'fragment', instance: child.scopeId, initialState: { value: 'reset' }, data: {} }));
    expect(environment.store.getState()).toBe(state); expect(environment.listScopes()).toEqual(scopes);
  });
  it('supports generic reducer initialization and cleanup for all scope types while rejecting stale writes', () => {
    const { store } = createRuntimeStore();
    for (const scope of ['app', 'view', 'fragment'] as const) store.dispatch(runtimeActions.initialize({ scope, instance: scope, initialState: { value: scope }, data: { items: success } }));
    expect(store.getState()).toMatchObject({ appState: { value: 'app' }, viewState: { value: 'view' }, fragments: { fragment: { state: { value: 'fragment' }, data: { items: success } } } });
    store.dispatch(runtimeActions.disposeScope({ scope: 'fragment', instance: 'fragment' }));
    const before = store.getState();
    store.dispatch(runtimeActions.set({ scope: 'fragment', instance: 'fragment', target: 'value', value: 'stale' }));
    store.dispatch(runtimeActions.patch({ scope: 'fragment', instance: 'missing', value: { value: 'stale' } }));
    store.dispatch(runtimeActions.dataChanged({ scope: 'fragment', instance: 'fragment', id: 'items', entry: success }));
    expect(store.getState()).toBe(before);
    store.dispatch(runtimeActions.disposeView('view'));
    store.dispatch(runtimeActions.disposeScope({ scope: 'app', instance: 'app' }));
    expect(store.getState()).toMatchObject({ appState: {}, appData: {}, viewState: {}, viewData: {}, fragments: {}, applicationInstance: null, viewInstance: null });
  });
  it('starts local datasource work once, reads local state and keeps loaded data in the fragment entry', async () => {
    const transport = vi.fn<ApiTransport>(async request => ({ value: request.query?.value }));
    const { fragment, environment } = setup(transport); const schema = definition();
    schema.dataSources.items = { type: 'api', request: { method: 'GET', path: '/api/items', query: { value: '$state.value' } }, load: { strategy: 'onScopeInit' } };
    const child = fragment(undefined, schema); write(child, 'local'); child.start(); child.start(); await tick();
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query).toEqual({ value: 'local' });
    expect(environment.store.getState().fragments[child.scopeId].data.items).toMatchObject({ status: 'success', data: { value: 'local' } });
    expect(environment.store.getState().viewData).toEqual({}); expect(environment.store.getState().schemaFragments).toEqual({});
  });
});

describe('scope disposal and stale work', () => {
  it('removes only a disposed fragment subtree and retains its sibling and host', () => {
    const { fragment, environment, view, app } = setup(); const a = fragment(); const nested = fragment(a); const b = fragment();
    const bState = environment.store.getState().fragments[b.scopeId]; a.dispose(); a.dispose();
    expect(a.signal.aborted).toBe(true); expect(nested.signal.aborted).toBe(true);
    expect(environment.store.getState().fragments).toEqual({ [b.scopeId]: bState });
    expect(environment.getScope(a.scopeId)).toBeUndefined(); expect(environment.getScope(nested.scopeId)).toBeUndefined();
    expect(view.active()).toBe(true); expect(app.active()).toBe(true); expect(b.active()).toBe(true);
    expect(() => a.initialize()).toThrow('disposed scope');
  });
  it('disposes view descendants while preserving application-owned fragment state', () => {
    const { fragment, environment, view, app } = setup(); const child = fragment(); const nested = fragment(child); const applicationChild = fragment(app);
    view.dispose();
    expect(child.active()).toBe(false); expect(nested.active()).toBe(false);
    expect(environment.store.getState().fragments).toHaveProperty(applicationChild.scopeId);
    expect(environment.store.getState().viewState).toEqual({}); expect(environment.store.getState().appState).toEqual(app.stateDefinition);
    expect(applicationChild.active()).toBe(true); expect(environment.viewScope).toBeNull();
  });
  it('replaces the active view and its descendants without disturbing the application', () => {
    const { fragment, environment, view, app, viewDefinition } = setup(); const child = fragment();
    const next = new ViewRuntime(viewDefinition, environment);
    expect(view.signal.aborted).toBe(true); expect(child.signal.aborted).toBe(true); expect(next.scopeId).not.toBe(view.scopeId);
    const before = environment.store.getState(); write(view, 'stale');
    environment.store.dispatch(runtimeActions.disposeScope({ scope: 'view', instance: view.scopeId }));
    expect(environment.store.getState()).toBe(before); expect(next.active()).toBe(true); expect(app.active()).toBe(true);
  });
  it('cleans the full application tree and allows a fresh application identity in the same store', () => {
    const { app, environment, fragment } = setup(); const child = fragment(); fragment(child); fragment(app);
    const store = environment.store; app.dispose(); app.dispose();
    expect(environment.listScopes()).toEqual([]); expect(environment.applicationScope).toBeNull(); expect(environment.viewScope).toBeNull();
    expect(store.getState()).toMatchObject({ appState: {}, appData: {}, viewState: {}, viewData: {}, fragments: {}, schemaFragments: {}, applicationInstance: null, viewInstance: null });
    const next = new RuntimeScope(definition('replacement'), 'application', environment);
    const before = store.getState(); write(app, 'stale');
    store.dispatch(runtimeActions.disposeScope({ scope: 'app', instance: app.scopeId }));
    expect(store.getState()).toBe(before); expect(next.scopeId).not.toBe(app.scopeId); expect(next.environment.store).toBe(store);
  });
  it('aborts scope and datasource requests and rejects late responses that ignore abort', async () => {
    let resolve!: (value: unknown) => void; const pending = new Promise<unknown>(yes => { resolve = yes; });
    const transport = vi.fn<ApiTransport>(() => pending); const { fragment, environment } = setup(transport); const schema = definition();
    schema.dataSources.items = { type: 'api', request: { method: 'GET', path: '/api/items' }, load: { strategy: 'manual' } };
    schema.actions.save = { type: 'api.request', request: { method: 'POST', path: '/api/items' }, target: 'saved' };
    const child = fragment(undefined, schema); const load = child.dataSources.reload('items'); const save = child.actionEngine.execute('save');
    child.dispose(); const replacement = fragment(undefined, schema); const before = environment.store.getState();
    expect(transport.mock.calls.every(([, signal]) => signal.aborted)).toBe(true);
    resolve({ value: 'late' }); await Promise.all([load, save]);
    await child.actionEngine.execute('set', { event: { value: 'late' } });
    expect(environment.store.getState()).toBe(before); expect(environment.store.getState().fragments[replacement.scopeId].state).not.toHaveProperty('saved');
  });
});
