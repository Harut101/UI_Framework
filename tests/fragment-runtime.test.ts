import { afterEach, describe, expect, it, vi } from 'vitest';
import { FragmentRuntime } from '../src/runtime/fragment/FragmentRuntime';
import { normalizeFragmentDefinition, normalizeLoadedFragment, validateFragmentDefinition } from '../src/runtime/fragment/normalizeFragmentDefinition';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { ActionEngine } from '../src/runtime/actions/ActionEngine';
import { DataSourceManager } from '../src/runtime/datasource/DataSourceManager';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { FragmentDefinition } from '../src/runtime/fragment/types';

const registry = new ComponentRegistry();
for (const type of ['stack', 'text', 'button', 'schema-outlet', 'spinner']) registry.register(type, () => null);
const roots: RuntimeScope[] = [];
function envelope(): FragmentDefinition {
  return {
    type: 'fragment', id: 'shared-fragment', state: { query: 'initial', fields: { value: 'literal' } },
    actions: { setQuery: { type: 'state.set', target: 'query', value: '$event.value' } },
    dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { query: '$state.query', view: '$viewState.query', app: '$appState.query' } }, dependsOn: ['$state.query'], load: { strategy: 'onInit', reload: 'onDependencyChange' } } },
    root: { type: 'stack', children: [
      { type: 'text', bindings: { value: '$state.query' } }, { type: 'button', handlers: { onClick: { action: 'setQuery' } } },
    ] },
  };
}
function setup(transport: ApiTransport = vi.fn(async () => ({ items: [] }))) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const base = { id: 'host', initialState: { query: 'application' }, dataSources: {}, actions: { hostOnly: { type: 'state.set' as const, target: 'query', value: 'host change' } } };
  const app = new RuntimeScope(base, 'application', environment); roots.push(app);
  const view = new RuntimeScope({ ...base, initialState: { query: 'view' } }, 'view', environment, app);
  return { environment, app, view, transport };
}
afterEach(() => roots.splice(0).forEach(scope => scope.dispose()));
async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }

describe('FragmentDefinition validation and normalization', () => {
  it('requires only type and root, defaults dictionaries, and generates deterministic component ids', () => {
    const wire = { type: 'fragment', root: { type: 'stack', children: [{ type: 'text', props: { value: 'Hello' } }] } };
    const normalized = normalizeFragmentDefinition(wire, registry);
    expect(normalized).toMatchObject({ type: 'fragment', id: 'fragment', state: {}, actions: {}, dataSources: {} });
    expect(normalized.root.id).toBe('fragment.node.root'); expect(normalized.root.children?.[0].id).toBe('fragment.node.root.children.0');
    expect(normalizeFragmentDefinition(wire, registry)).toEqual(normalized);
    expect(wire.root).not.toHaveProperty('id');
    expect(() => validateFragmentDefinition(wire, registry)).not.toThrow();
  });
  it('preserves explicit ids and prevents generated ids from colliding with explicit ones', () => {
    const normalized = normalizeFragmentDefinition({ type: 'fragment', root: { type: 'stack', children: [{ id: 'fragment.node.root', type: 'text' }, { type: 'text' }] } }, registry);
    expect(normalized.root.id).toBe('fragment.node.root~1'); expect(normalized.root.children?.[0].id).toBe('fragment.node.root');
    expect(new Set([normalized.root.id, ...normalized.root.children!.map(child => child.id)]).size).toBe(3);
  });
  it('normalizes onInit to the common onScopeInit policy without mutating frozen JSON', () => {
    const wire = envelope(); Object.freeze(wire); Object.freeze(wire.dataSources!.items.load); Object.freeze(wire.state!);
    const normalized = normalizeFragmentDefinition(wire, registry);
    expect(normalized.dataSources.items.load.strategy).toBe('onScopeInit'); expect(wire.dataSources!.items.load.strategy).toBe('onInit');
    expect(normalized.state).not.toBe(wire.state); expect(normalized.root).not.toBe(wire.root);
    expect(JSON.parse(JSON.stringify(normalized))).toEqual(normalized);
  });
  it('keeps initial state literal and normalizes all loading/error child ids', () => {
    const normalized = normalizeFragmentDefinition({ type: 'fragment', state: { literal: '$viewState.query' }, schemaSources: { nested: { request: { path: '/api/nested' }, load: { strategy: 'onDemand' } } }, root: { type: 'schema-outlet', source: 'nested', loading: { type: 'spinner' }, error: { type: 'text' } } }, registry);
    expect(normalized.state.literal).toBe('$viewState.query');
    expect(normalized.root.loading?.id).toBe('fragment.node.root.loading'); expect(normalized.root.error?.id).toBe('fragment.node.root.error');
  });
  it.each([
    null, [], {}, { root: { type: 'stack' } }, { type: 'fragment' }, { type: 'fragment', root: null },
    { type: 'fragment', id: '', root: { type: 'stack' } }, { type: 'fragment', state: null, root: { type: 'stack' } },
    { type: 'fragment', actions: [], root: { type: 'stack' } }, { type: 'fragment', dataSources: [], root: { type: 'stack' } },
    { type: 'fragment', initialState: {}, root: { type: 'stack' } }, { type: 'fragment', kind: 'fragment', schemaVersion: 1, root: { type: 'stack' } },
    { type: 'fragment', root: { type: 'missing' } }, { type: 'fragment', root: { type: 'route-outlet' } },
    { type: 'fragment', root: { type: 'stack', children: {} } },
  ])('rejects malformed envelope %# before any activation', value => {
    expect(() => normalizeFragmentDefinition(value, registry)).toThrow();
  });
  it('rejects duplicate ids, unknown local handlers, inline actions, invalid expressions and undeclared sources', () => {
    for (const root of [
      { type: 'stack', children: [{ id: 'same', type: 'text' }, { id: 'same', type: 'text' }] },
      { type: 'button', handlers: { onClick: { action: 'hostOnly' } } },
      { type: 'button', handlers: { onClick: { action: 'setQuery', type: 'state.set' } } },
      { type: 'text', bindings: { value: '$scopes.other.query' } }, { type: 'text', visibility: '$state.__proto__.visible' },
      { type: 'schema-outlet', source: 'missing' },
    ]) expect(() => normalizeFragmentDefinition({ ...envelope(), root }, registry)).toThrow();
  });
  it('validates local action references, dependency cycles and fragment init policies', () => {
    for (const update of [
      { actions: { run: { type: 'sequence', actions: ['missing'] } } },
      { actions: { run: { type: 'api.request', request: { method: 'GET', path: '/api/items' }, onSuccess: 'missing' } } },
      { actions: { setQuery: { type: 'state.set', target: '$viewState.query', value: 'wrong' } } },
      { dataSources: { items: { ...envelope().dataSources!.items, dependsOn: ['$data.items.data'] } } },
      { dataSources: { items: { ...envelope().dataSources!.items, load: { strategy: 'onViewInit' } } } },
      { dataSources: { items: { ...envelope().dataSources!.items, load: { strategy: 'onAppInit' } } } },
    ]) expect(() => normalizeFragmentDefinition({ ...envelope(), ...update }, registry)).toThrow();
  });
  it('rejects non-JSON state, cycles, accessors and oversized trees/definitions without executing code', () => {
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    const getter = vi.fn(() => 'secret'); const accessors = Object.defineProperty({}, 'query', { enumerable: true, get: getter });
    for (const state of [{ value: () => 'code' }, { date: new Date() }, cyclic, accessors]) expect(() => normalizeFragmentDefinition({ type: 'fragment', state, root: { type: 'stack' } }, registry)).toThrow();
    expect(getter).not.toHaveBeenCalled();
    expect(() => normalizeFragmentDefinition({ type: 'fragment', root: { type: 'text', props: { value: 'x'.repeat(1_048_576) } } }, registry)).toThrow('limit');
    expect(() => normalizeFragmentDefinition({ type: 'fragment', root: { type: 'stack', children: Array.from({ length: 1001 }, () => ({ type: 'text' })) } }, registry)).toThrow('limit');
    let root: object = { type: 'text' }; for (let i = 0; i < 70; i++) root = { type: 'stack', children: [root] };
    expect(() => normalizeFragmentDefinition({ type: 'fragment', root }, registry)).toThrow('limit');
  });
  it('wraps legacy ComponentDefinition with host scope semantics and validates its host action references', () => {
    const { view, environment } = setup(); const before = environment.listScopes();
    const result = normalizeLoadedFragment({ type: 'button', handlers: { onClick: { action: 'hostOnly' } } }, view.definition, registry);
    expect(result.scope).toBe('host'); expect(result.definition).toMatchObject({ type: 'fragment', state: {}, actions: {}, dataSources: {}, root: { type: 'button' } });
    expect(environment.listScopes()).toEqual(before);
    expect(() => normalizeLoadedFragment({ type: 'fragment', root: { type: 'button', handlers: { onClick: { action: 'hostOnly' } } } }, view.definition, registry)).toThrow('Unknown handler');
  });
});

describe('FragmentRuntime composes the existing RuntimeScope', () => {
  it('initializes state, idle datasource entries, actions and dependencies before returning', () => {
    const { environment, app, view, transport } = setup(); const fragment = new FragmentRuntime(envelope(), view, registry);
    const state = environment.store.getState().fragments[fragment.scopeId];
    expect(fragment.scope).toBeInstanceOf(RuntimeScope); expect(fragment.scope.actionEngine).toBeInstanceOf(ActionEngine); expect(fragment.scope.dataSources).toBeInstanceOf(DataSourceManager);
    expect(fragment.scope.environment.store).toBe(environment.store); expect(fragment.scope.parentScope).toBe(view); expect(fragment.scope.applicationScope).toBe(app); expect(fragment.scope.viewScope).toBe(view);
    expect(state.state).toEqual({ query: 'initial', fields: { value: 'literal' } });
    expect(state.data.items).toEqual({ status: 'idle', loading: false, data: null, error: null });
    expect(environment.dependencyGraph.registrations()).toContainEqual({ target: { scopeId: fragment.scopeId, sourceId: 'items' }, paths: [{ scopeId: fragment.scopeId, area: 'state', path: ['query'] }] });
    expect(fragment.initialize()).toBe(fragment); expect(transport).not.toHaveBeenCalled();
  });
  it('gives two instances of the same cached definition independent scopes, actions, local state and data', async () => {
    const { environment, view } = setup(); const wire = envelope(); const a = new FragmentRuntime(wire, view, registry); const b = new FragmentRuntime(wire, view, registry);
    expect(a.scopeId).not.toBe(b.scopeId); expect(a.definition.root.id).toBe(b.definition.root.id);
    const before = environment.store.getState();
    await a.scope.actionEngine.execute('setQuery', { scope: a.scope, event: { value: 'A only' } });
    expect(environment.store.getState().fragments[a.scopeId].state.query).toBe('A only');
    expect(environment.store.getState().fragments[b.scopeId]).toBe(before.fragments[b.scopeId]); expect(environment.store.getState().viewState).toBe(before.viewState);
    expect(wire.state?.query).toBe('initial'); expect(wire.root.id).toBeUndefined();
  });
  it('starts onInit once and uses the shared scoped request/dependency reload path', async () => {
    const transport = vi.fn<ApiTransport>(async request => ({ items: [request.query?.query] }));
    const { environment, view } = setup(transport); const fragment = new FragmentRuntime(envelope(), view, registry);
    fragment.start(); fragment.start(); await flush();
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][0].query).toEqual({ query: 'initial', view: 'view', app: 'application' });
    expect(environment.store.getState().fragments[fragment.scopeId].data.items).toMatchObject({ status: 'success', data: { items: ['initial'] } });
    await fragment.scope.actionEngine.execute('setQuery', { scope: fragment.scope, event: { value: 'updated' } }); await flush();
    expect(transport).toHaveBeenCalledTimes(2); expect(environment.store.getState().fragments[fragment.scopeId].data.items.data).toEqual({ items: ['updated'] });
  });
  it('supports nested fragments and application-level fragments without inventing a view owner', () => {
    const { app, view } = setup(); const a = new FragmentRuntime(envelope(), view, registry); const nested = new FragmentRuntime(envelope(), a.scope, registry);
    const navigation = new FragmentRuntime({ type: 'fragment', root: { type: 'text' } }, app, registry);
    expect(nested.scope.parentScope).toBe(a.scope); expect(nested.scope.viewScope).toBe(view); expect(navigation.scope.viewScope).toBeNull();
    a.dispose(); expect(nested.scope.active()).toBe(false); expect(navigation.scope.active()).toBe(true);
  });
  it('does not publish state/resources on validation failure or activate under a disposed parent', () => {
    const { view, environment } = setup(); const before = environment.store.getState(); const scopes = environment.listScopes();
    expect(() => new FragmentRuntime({ type: 'fragment', state: {}, root: { type: 'missing' } }, view, registry)).toThrow();
    expect(environment.store.getState()).toBe(before); expect(environment.listScopes()).toEqual(scopes); expect(environment.dependencyGraph.registrations()).toEqual([]);
    view.dispose(); expect(() => new FragmentRuntime(envelope(), view, registry)).toThrow('Parent scope must be active');
  });
  it('disposes state, dependency registrations and requests and ignores late datasource responses', async () => {
    let resolve!: (value: unknown) => void; const pending = new Promise(yes => { resolve = yes; }); const transport = vi.fn<ApiTransport>(() => pending);
    const { environment, view } = setup(transport); const fragment = new FragmentRuntime(envelope(), view, registry); fragment.start();
    fragment.dispose(); fragment.dispose(); expect(transport.mock.calls[0][1].aborted).toBe(true);
    expect(environment.store.getState().fragments).toEqual({}); expect(environment.dependencyGraph.registrations()).toEqual([]);
    const before = environment.store.getState(); resolve({ items: ['late'] }); await flush(); expect(environment.store.getState()).toBe(before);
  });
});

describe('bounded fragment nesting', () => {
  it('stops a unique-definition scope chain before publishing a 33rd fragment', () => {
    const { view, environment } = setup(); let parent = view;
    for (let index = 0; index < 32; index++) parent = new FragmentRuntime({ type: 'fragment', root: { type: 'stack' } }, parent, registry).scope;
    const before = environment.store.getState();
    expect(() => new FragmentRuntime({ type: 'fragment', root: { type: 'stack' } }, parent, registry)).toThrow('32 scopes');
    expect(environment.store.getState()).toBe(before); expect(environment.listScopes().filter(scope => scope.type === 'fragment')).toHaveLength(32);
  });
});
