import { afterEach, describe, expect, it, vi } from 'vitest';
import { DependencyGraph } from '../src/runtime/datasource/DependencyGraph';
import { BindingEngine } from '../src/runtime/binding/BindingEngine';
import type { ApiTransport } from '../src/runtime/datasource/api';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { runtimeActions } from '../src/runtime/redux/runtimeActions';
import { validateViewDefinition, validateApplicationDefinition } from '../src/runtime/shared/validation';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import type { DataEntry, RuntimeScopeDefinition, ViewDefinition } from '../src/runtime/shared/types';

const roots: RuntimeScope[] = [];
function definition(query: string): RuntimeScopeDefinition {
  return {
    id: 'same-schema', initialState: { query, visible: true, flag: false, count: 0, label: '', nullable: null },
    dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { query: '$state.query', view: '$viewState.query', app: '$appState.query' } }, load: { strategy: 'manual' } } },
    actions: {
      set: { type: 'state.set', target: 'query', value: '$event.value' },
      hide: { type: 'state.set', target: 'visible', value: false },
      copy: { type: 'state.patch', value: { local: '$state.query', view: '$viewState.query', app: '$appState.query', event: '$event.value', response: '$response.id' } },
      request: { type: 'api.request', request: { method: 'GET', path: '/api/items', query: { local: '$state.query', view: '$viewState.query', app: '$appState.query' } }, onSuccess: 'received' },
      received: { type: 'state.set', target: 'received', value: '$response.id' },
    },
  };
}
function setup() {
  const transport = vi.fn<ApiTransport>(async () => ({ id: 'response' }));
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const app = new RuntimeScope(definition('app'), 'application', environment); roots.push(app);
  const view = new RuntimeScope(definition('view'), 'view', environment, app);
  const a = new RuntimeScope(definition('A'), 'fragment', environment, view);
  const b = new RuntimeScope(definition('B'), 'fragment', environment, view);
  const nested = new RuntimeScope(definition('nested'), 'fragment', environment, a);
  for (const scope of [app, view, a, b, nested]) {
    const entry: DataEntry = { status: 'success', loading: false, data: { query: scope.stateDefinition.query }, error: null };
    environment.store.dispatch(runtimeActions.dataChanged({ scope: scope.scope, instance: scope.scopeId, id: 'items', entry }));
  }
  return { environment, app, view, a, b, nested, transport, resolver: environment.resolver, engine: new BindingEngine(environment.resolver) };
}
afterEach(() => roots.splice(0).forEach(root => root.dispose()));

describe('scope-aware namespace resolution', () => {
  it('addresses current state/data in application, view, sibling and nested fragment scopes', () => {
    const { environment, app, view, a, b, nested, resolver } = setup();
    const state = environment.store.getState();
    for (const [scope, query] of [[app, 'app'], [view, 'view'], [a, 'A'], [b, 'B'], [nested, 'nested']] as const) {
      expect(resolver.resolve('$state.query', { state, scope })).toBe(query);
      expect(resolver.resolve('$data.items.data.query', { state, scope })).toBe(query);
      expect(resolver.resolve('$appState.query', { state, scope })).toBe('app');
      expect(resolver.resolve('$appData.items.data.query', { state, scope })).toBe('app');
      expect(resolver.resolve('$viewState.query', { state, scope })).toBe(scope === app ? undefined : 'view');
      expect(resolver.resolve('$viewData.items.data.query', { state, scope })).toBe(scope === app ? undefined : 'view');
    }
  });
  it('does not invent a view owner for application-level fragments', () => {
    const { environment, app, resolver } = setup();
    const navigation = new RuntimeScope(definition('navigation'), 'fragment', environment, app);
    const context = { state: environment.store.getState(), scope: navigation };
    expect(resolver.resolve('$state.query', context)).toBe('navigation');
    expect(resolver.resolve('$viewState.query', context)).toBeUndefined();
    expect(resolver.resolve('$viewData', context)).toBeUndefined();
    expect(resolver.resolve('$appState.query', context)).toBe('app');
  });
  it('uses the supplied snapshot rather than reading the environment store during selection', async () => {
    const { environment, a, resolver } = setup(); const state = environment.store.getState();
    await a.actionEngine.execute('set', { event: { value: 'new' } });
    expect(resolver.resolve('$state.query', { state, scope: a })).toBe('A');
    expect(resolver.resolve('$state.query', { state: environment.store.getState(), scope: a })).toBe('new');
  });
  it('preserves legacy unscoped projections and the transitional fragment-id context', () => {
    const { environment, a, resolver } = setup(); const state = environment.store.getState();
    expect(resolver.resolve('$state.query', { state })).toBe('view');
    expect(resolver.resolve('$data.items.data.query', { state })).toBe('view');
    expect(resolver.resolve('$state.query', { state, scopeId: a.scopeId })).toBe('A');
    expect(resolver.resolve('$state.query', { state, scopeId: 'absent' })).toBeUndefined();
  });
  it('never redirects disposed or replaced scopes into a new view, fragment or application', () => {
    const { environment, a, app, view, resolver } = setup();
    a.dispose(); const replacement = new RuntimeScope(definition('replacement'), 'fragment', environment, view);
    expect(resolver.resolve('$state.query', { state: environment.store.getState(), scope: a })).toBeUndefined();
    expect(resolver.resolve('$state.query', { state: environment.store.getState(), scope: replacement })).toBe('replacement');
    new RuntimeScope(definition('new view'), 'view', environment, app);
    expect(resolver.resolve('$viewState.query', { state: environment.store.getState(), scope: a })).toBeUndefined();
    expect(resolver.resolve('$state.query', { state: environment.store.getState(), scope: view })).toBeUndefined();
    app.dispose(); const next = new RuntimeScope(definition('new app'), 'application', environment); roots.push(next);
    expect(resolver.resolve('$appState.query', { state: environment.store.getState(), scope: a })).toBeUndefined();
  });
  it('resolves event/response payloads and encoded request paths with the same context', () => {
    const { environment, a, resolver } = setup();
    const context = { state: environment.store.getState(), scope: a, event: { value: 'a/b' }, response: { id: 7 } };
    expect(resolver.resolve({ event: '$event.value', response: '$response.id', nested: ['$state.query'] }, context)).toEqual({ event: 'a/b', response: 7, nested: ['A'] });
    expect(resolver.resolvePath('/api/$state.query/$viewState.query/$appState.query/$event.value/$response.id', context)).toBe('/api/A/view/app/a%2Fb/7');
    expect(resolver.resolve('$event.missing', context)).toBeUndefined();
    expect(resolver.resolve('$response.id', { ...context, response: undefined })).toBeUndefined();
  });
  it('keeps null/missing traversal safe and rejects unsafe paths and arbitrary expressions', () => {
    const { environment, a, resolver } = setup(); const context = { state: environment.store.getState(), scope: a };
    for (const path of ['$state.nullable.value', '$data.missing.data.items', '$viewState.missing.value', '$appData.items.data.missing']) expect(resolver.resolve(path, context)).toBeUndefined();
    for (const root of ['$state', '$data', '$viewState', '$viewData', '$appState', '$appData', '$event', '$response']) {
      for (const suffix of ['.__proto__.x', '.constructor', '..query', '.']) expect(() => resolver.resolve(root + suffix, context)).toThrow('Unsafe');
    }
    expect(resolver.resolve('$state.query.toUpperCase()', context)).toBeUndefined();
    expect(() => resolver.resolve('$javascript.alert', context)).toThrow('Unknown');
    expect(resolver.resolve('$event.inherited', { ...context, event: Object.create({ inherited: true }) })).toBeUndefined();
  });
  it('passes local and ancestor namespaces through named actions, datasource and API response handlers', async () => {
    const { environment, a, b, transport } = setup();
    await a.actionEngine.execute('copy', { event: { value: 'payload' }, response: { id: 7 } });
    expect(environment.store.getState().fragments[a.scopeId].state).toMatchObject({ local: 'A', view: 'view', app: 'app', event: 'payload', response: 7 });
    await a.dataSources.reload('items');
    expect(transport.mock.calls[0][0].query).toEqual({ query: 'A', view: 'view', app: 'app' });
    await a.actionEngine.execute('request');
    expect(transport.mock.calls[1][0].query).toEqual({ local: 'A', view: 'view', app: 'app' });
    expect(environment.store.getState().fragments[a.scopeId].state.received).toBe('response');
    expect(environment.store.getState().fragments[b.scopeId].state.received).toBeUndefined();
  });
});

describe('scope-aware binding selectors', () => {
  it('keeps independent selectors for the same bindings and stabilizes unrelated updates', async () => {
    const { environment, a, b, engine } = setup(); const bindings = { value: '$state.query' as const };
    const selectA = engine.createSelector(bindings, a); const selectB = engine.createSelector(bindings, b);
    const beforeA = selectA(environment.store.getState()); const beforeB = selectB(environment.store.getState());
    expect(beforeA.value).toBe('A'); expect(beforeB.value).toBe('B');
    await a.actionEngine.execute('set', { event: { value: 'edited A' } });
    expect(selectA(environment.store.getState())).toEqual({ value: 'edited A', __visible: true });
    expect(selectA(environment.store.getState())).not.toBe(beforeA);
    expect(selectB(environment.store.getState())).toBe(beforeB);
  });
  it('uses stable literal array/object defaults across state changes and resolved/unresolved transitions', () => {
    const { environment, a, b, engine } = setup(); const array: [] = []; const object = { label: 'default' };
    const select = engine.createSelector({ items: { source: '$data.other.data.items', default: array }, options: { source: '$state.options', default: object } }, a);
    const initial = select(environment.store.getState());
    expect(initial.items).toBe(array); expect(initial.options).toBe(object);
    environment.store.dispatch(runtimeActions.set({ scope: b.scope, instance: b.scopeId, target: 'query', value: 'unrelated' }));
    expect(select(environment.store.getState())).toBe(initial);
    environment.store.dispatch(runtimeActions.set({ scope: a.scope, instance: a.scopeId, target: 'options', value: { label: 'resolved' } }));
    expect(select(environment.store.getState()).options).toEqual({ label: 'resolved' });
    environment.store.dispatch(runtimeActions.set({ scope: a.scope, instance: a.scopeId, target: 'options', value: null }));
    expect(select(environment.store.getState()).options).toBe(object);
  });
  it('preserves falsy values and literal defaults without evaluating defaults as expressions', () => {
    const { environment, a, engine } = setup();
    const select = engine.createSelector({ flag: { source: '$state.flag', default: true }, count: { source: '$state.count', default: 9 }, label: { source: '$state.label', default: 'fallback' }, literal: { source: '$state.absent', default: { value: '$state.query' } } }, a);
    expect(select(environment.store.getState())).toEqual({ flag: false, count: 0, label: '', literal: { value: '$state.query' }, __visible: true });
  });
  it('reacts to local and ancestor visibility independently of sibling state', async () => {
    const { environment, a, b, view, engine } = setup();
    const localA = engine.createSelector({}, a, '$state.visible'); const localB = engine.createSelector({}, b, '$state.visible');
    const owningView = engine.createSelector({}, a, '$viewState.visible');
    const stableB = localB(environment.store.getState());
    await a.actionEngine.execute('hide');
    expect(localA(environment.store.getState()).__visible).toBe(false); expect(localB(environment.store.getState())).toBe(stableB);
    expect(owningView(environment.store.getState()).__visible).toBe(true);
    await view.actionEngine.execute('hide');
    expect(owningView(environment.store.getState()).__visible).toBe(false);
    expect(engine.createSelector({}, a, '$state.absent')(environment.store.getState()).__visible).toBe(false);
    expect(engine.createSelector({}, a, true)(environment.store.getState()).__visible).toBe(true);
    expect(engine.createSelector({}, a, false)(environment.store.getState()).__visible).toBe(false);
  });
  it('falls back safely after disposal rather than reading host or replacement fragment values', () => {
    const { environment, a, engine } = setup();
    const select = engine.createSelector({ query: { source: '$state.query', default: 'missing' } }, a, '$state.visible');
    a.dispose(); expect(select(environment.store.getState())).toEqual({ query: 'missing', __visible: false });
  });
  it('validates owning-view namespaces in JSON bindings, visibility, handlers and requests', () => {
    const { view } = setup(); const registry = new ComponentRegistry().register('text', () => null);
    const schema: ViewDefinition = { ...view.definition, title: 'Scoped', root: { id: 'text', type: 'text', bindings: { value: '$viewState.query' }, visibility: '$viewData.items.loading' } };
    expect(() => validateViewDefinition(schema, registry)).not.toThrow();
    expect(() => validateApplicationDefinition({ ...definition('app'), schemaSources: { local: { request: { path: '/api/$state.query' }, load: { strategy: 'onDemand' } } }, shell: { id: 'outlet', type: 'route-outlet' }, routes: [], views: {} }, registry)).not.toThrow();
    expect(() => validateApplicationDefinition({ ...definition('app'), schemaSources: { local: { request: { path: '/api/$viewState.query' }, load: { strategy: 'onDemand' } } }, shell: { id: 'outlet', type: 'route-outlet' }, routes: [], views: {} }, registry)).toThrow('no owning view');
  });
});


describe('expression contexts used by resource infrastructure', () => {
  it.each(['application', 'view'] as const)('preserves dependency reloads for %s expression aliases', async type => {
    const { environment, app, transport } = setup();
    environment.viewScope?.dispose();
    const schema = definition('local');
    schema.dataSources.items.dependsOn = [type === 'application' ? '$state.query' : '$viewState.query'];
    schema.dataSources.items.load = { strategy: 'onScopeInit', reload: 'onDependencyChange' };
    let scope: RuntimeScope;
    if (type === 'application') {
      app.dispose(); scope = new RuntimeScope(schema, type, environment); roots.push(scope);
    } else scope = new RuntimeScope(schema, type, environment, app);
    scope.start(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(transport).toHaveBeenCalledTimes(1);
    await scope.actionEngine.execute('set', { event: { value: 'changed' } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0].query?.query).toBe('changed');
    expect(environment.store.getState().fragments).toEqual({});
  });
  it('resolves remote schema source requests in the fragment host scope', async () => {
    const { environment, a, transport } = setup();
    a.definition.schemaSources = { content: { request: { path: '/api/$state.query/$viewState.query/$appState.query', query: { data: '$data.items.data.query' } }, load: { strategy: 'onDemand' } } };
    transport.mockResolvedValueOnce({ id: 'loaded', type: 'text' });
    const registry = new ComponentRegistry().register('text', () => null);
    const lease = a.schemaFragments.acquire('content', null, (value): asserts value is import('../src/runtime/shared/types').ComponentDefinition => {
      validateViewDefinition({ ...a.definition, title: 'Loaded', root: value }, registry);
    });
    await lease.promise;
    expect(transport.mock.calls[0][0]).toMatchObject({ path: '/api/A/view/app', query: { data: 'A' } });
    expect(environment.store.getState().schemaFragments[lease.id].status).toBe('success');
    lease.release();
  });
});


describe('datasource expression alias cycle safety', () => {
  it.each(['app', 'view'] as const)('rejects cycles expressed through local %s data aliases', scope => {
    const schema = definition('local');
    schema.dataSources.items.dependsOn = [scope === 'app' ? '$data.items.data' : '$viewData.items.data'];
    expect(() => new DependencyGraph(schema.dataSources, scope)).toThrow('Circular');
  });
});
