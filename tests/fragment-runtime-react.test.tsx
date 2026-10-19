// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode, type ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createFluentRoot } from './fluent-root';
import { createComponentRegistry } from '../src/components/registry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import type { ViewDefinition, ComponentDefinition } from '../src/runtime/shared/types';
import type { FragmentDefinition } from '../src/runtime/fragment/types';
import type { ApiTransport } from '../src/runtime/datasource/api';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let environment: RuntimeEnvironment;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); environment?.applicationScope?.dispose(); container.remove(); vi.restoreAllMocks(); });
function envelope(query = 'local'): FragmentDefinition {
  return { type: 'fragment', state: { query }, actions: { setQuery: { type: 'state.set', target: 'query', value: 'edited' } },
    dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { query: '$state.query' } }, dependsOn: ['$state.query'], load: { strategy: 'onInit', reload: 'onDependencyChange' } } },
    root: { type: 'stack', children: [
      { type: 'probe', bindings: { value: { source: '$state.query', default: 'UNINITIALIZED' }, items: { source: '$data.items.data.items', default: [] }, status: { source: '$data.items.status', default: 'UNINITIALIZED' } } },
      { type: 'button', props: { label: 'Edit local query' }, handlers: { onClick: { action: 'setQuery' } } },
    ] } };
}
function outlet(id = 'outlet'): ComponentDefinition { return { id, type: 'schema-outlet', source: 'remote', key: '$state.selected', enabled: '$state.enabled' }; }
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }
async function mount(transport: ApiTransport, options: { root?: ComponentDefinition; strict?: boolean; cache?: 'view' | 'application' | 'none' } = {}) {
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const registry = createComponentRegistry(); const rendered: { value: string; status: string; items: unknown[] }[] = [];
  registry.register('probe', ({ value, status, items }: { value: string; status: string; items: unknown[] }) => {
    rendered.push({ value, status, items }); return <p data-testid="probe">{value}|{status}|{items.join(',')}</p>;
  });
  const definition: ViewDefinition = { id: 'host-view', title: 'Host', initialState: { query: 'host', selected: 'one', enabled: true }, dataSources: {}, actions: {
    setQuery: { type: 'state.set', target: 'query', value: 'host edited' }, enable: { type: 'state.set', target: 'enabled', value: '$event.value' }, select: { type: 'state.set', target: 'selected', value: '$event.value' },
  }, schemaSources: { remote: { request: { path: '/api/fragment/$state.selected' }, load: { strategy: 'onDemand', cache: options.cache ?? 'view' } } }, root: options.root ?? outlet() };
  const runtime = new ViewRuntime(definition, environment);
  const element = <Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={definition.root}/></RuntimeContext.Provider></Provider>;
  await act(async () => root.render(options.strict ? <StrictMode>{element}</StrictMode> : element));
  return { runtime, registry, definition, rendered };
}
const fragments = () => environment.listScopes().filter(scope => scope.type === 'fragment');
const probes = () => [...container.querySelectorAll('[data-testid=probe]')].map(node => node.textContent);

describe('FragmentRuntime activation through the existing SchemaOutlet', () => {
  it('never renders before local state/data exist, then loads and updates using real runtime layers', async () => {
    const wire = envelope(); const pending = deferred();
    const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? wire : pending.promise);
    const { rendered } = await mount(transport);
    expect(fragments()).toHaveLength(1); expect(probes()).toEqual(['local|loading|']);
    expect(rendered.every(props => props.value !== 'UNINITIALIZED' && props.status !== 'UNINITIALIZED')).toBe(true);
    const scope = fragments()[0]; expect(environment.store.getState().fragments[scope.scopeId].state.query).toBe('local');
    await act(async () => pending.resolve({ items: ['loaded'] })); expect(probes()).toEqual(['local|success|loaded']);
    transport.mockImplementation(async request => request.path.startsWith('/api/fragment/') ? wire : { items: [request.query?.query] });
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(probes()).toEqual(['edited|success|edited']); expect(environment.store.getState().viewState.query).toBe('host');
    expect(transport.mock.calls.filter(([request]) => request.path === '/api/items')).toHaveLength(2);
    expect(wire.state?.query).toBe('local'); expect(wire.root.id).toBeUndefined();
  });
  it('shares cached JSON/HTTP across two outlets while creating independent scopes, actions and datasources', async () => {
    const wire = envelope(); const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? wire : { items: [request.query?.query] });
    await mount(transport, { root: { id: 'two', type: 'stack', children: [outlet('left'), outlet('right')] } });
    const [a, b] = fragments(); expect(a.scopeId).not.toBe(b.scopeId); expect(probes()).toEqual(['local|success|local', 'local|success|local']);
    expect(transport.mock.calls.filter(([request]) => request.path.startsWith('/api/fragment/'))).toHaveLength(1);
    expect(transport.mock.calls.filter(([request]) => request.path === '/api/items')).toHaveLength(2);
    const cached = Object.values(environment.store.getState().schemaFragments)[0].schema;
    expect(cached).toEqual(wire); expect(cached).not.toHaveProperty('scopeId'); expect(JSON.parse(JSON.stringify(cached))).toEqual(wire);
    const beforeB = environment.store.getState().fragments[b.scopeId];
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(probes()).toEqual(['edited|success|edited', 'local|success|local']);
    expect(environment.store.getState().fragments[b.scopeId]).toBe(beforeB);
    expect(environment.store.getState().schemaFragments[Object.keys(environment.store.getState().schemaFragments)[0]].schema).toBe(cached);
  });
  it('reuses definition cache but creates fresh local state on deactivation/reactivation', async () => {
    const wire = envelope(); const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? wire : { items: [] });
    const { runtime } = await mount(transport); const first = fragments()[0];
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    await act(async () => runtime.actionEngine.execute('enable', { scope: runtime, event: { value: false } }));
    expect(fragments()).toEqual([]); expect(environment.store.getState().fragments).toEqual({}); expect(environment.dependencyGraph.registrations()).toEqual([]);
    await act(async () => runtime.actionEngine.execute('enable', { scope: runtime, event: { value: true } }));
    expect(fragments()[0].scopeId).not.toBe(first.scopeId); expect(probes()[0]).toContain('local|');
    expect(transport.mock.calls.filter(([request]) => request.path.startsWith('/api/fragment/'))).toHaveLength(1);
  });
  it('replaces scopes on key change and rejects a late datasource response from the old scope', async () => {
    const oldData = deferred(); let dataCalls = 0;
    const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? envelope(request.path.endsWith('one') ? 'one' : 'two') : ++dataCalls === 1 ? oldData.promise : { items: ['current'] });
    const { runtime } = await mount(transport); const first = fragments()[0];
    await act(async () => runtime.actionEngine.execute('select', { event: { value: 'two' }, scope: runtime }));
    const current = fragments()[0]; expect(current.scopeId).not.toBe(first.scopeId); expect(first.active()).toBe(false);
    expect(transport.mock.calls.find(([request]) => request.path === '/api/items')![1].aborted).toBe(true);
    await act(async () => oldData.resolve({ items: ['obsolete'] }));
    expect(probes()).toEqual(['two|success|current']); expect(environment.store.getState().fragments[first.scopeId]).toBeUndefined();
  });
  it('supports fragment-local nested sources and child fragment scopes without inheriting parent actions', async () => {
    const outer: FragmentDefinition = { type: 'fragment', state: { childId: 'child', query: 'outer' }, actions: {},
      schemaSources: { nested: { request: { path: '/api/nested/$state.childId' }, load: { strategy: 'onDemand' } } },
      root: { type: 'stack', children: [{ type: 'text', bindings: { value: '$state.query' } }, { type: 'schema-outlet', source: 'nested' }] } };
    const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? outer : request.path === '/api/nested/child' ? envelope('inner') : { items: [] });
    const { runtime } = await mount(transport);
    const [parent, child] = fragments(); expect(child.parentScope).toBe(parent); expect(child.viewScope).toBe(runtime);
    expect(transport.mock.calls.map(([request]) => request.path)).toContain('/api/nested/child'); expect(probes()[0]).toContain('inner|success');
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().fragments[child.scopeId].state.query).toBe('edited'); expect(environment.store.getState().fragments[parent.scopeId].state.query).toBe('outer');
    await act(async () => runtime.actionEngine.execute('enable', { event: { value: false } }));
    expect(fragments()).toEqual([]); expect(environment.dependencyGraph.registrations()).toEqual([]);
  });
  it('keeps legacy bare trees host-scoped after normalization', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ type: 'stack', children: [{ type: 'text', bindings: { value: '$state.query' } }, { type: 'button', props: { label: 'Edit host' }, handlers: { onClick: { action: 'setQuery' } } }] }));
    await mount(transport); expect(fragments()).toEqual([]); expect(container.textContent).toContain('host');
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().viewState.query).toBe('host edited'); expect(container.textContent).toContain('host edited');
  });
  it('rejects invalid explicit fragments locally and retries without leaking scopes or registrations', async () => {
    const wire = envelope(); const invalid = { ...wire, actions: {} };
    const transport = vi.fn<ApiTransport>().mockResolvedValueOnce(invalid).mockImplementation(async request => request.path.startsWith('/api/fragment/') ? wire : { items: [] });
    await mount(transport); expect(container.textContent).toContain('Unable to load content'); expect(fragments()).toEqual([]);
    expect(environment.dependencyGraph.registrations()).toEqual([]);
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Retry content')!.click());
    expect(fragments()).toHaveLength(1); expect(probes()[0]).toContain('local|success');
  });
  it('replays StrictMode with one live scope and one init request, using the shared lifecycle host', async () => {
    const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? envelope() : { items: [] });
    await mount(transport, { strict: true });
    expect(fragments()).toHaveLength(1); expect(Object.keys(environment.store.getState().fragments)).toHaveLength(1);
    expect(environment.dependencyGraph.registrations()).toHaveLength(1);
    expect(transport.mock.calls.filter(([request]) => request.path === '/api/items')).toHaveLength(1);
    expect(probes()[0]).toContain('local|success');
  });
  it('disposes descendants even when their definition remains application-cached', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/fragment/') ? envelope() : pending.promise);
    const { runtime } = await mount(transport, { cache: 'application' }); expect(fragments()).toHaveLength(1);
    await act(async () => runtime.dispose());
    expect(fragments()).toEqual([]); expect(environment.store.getState().fragments).toEqual({}); expect(environment.dependencyGraph.registrations()).toEqual([]);
    expect(Object.values(environment.store.getState().schemaFragments)[0].schema).toMatchObject({ type: 'fragment' });
    expect(transport.mock.calls.find(([request]) => request.path === '/api/items')![1].aborted).toBe(true);
    await act(async () => pending.resolve({ items: ['late'] })); expect(probes()).toEqual([]);
  });
  it('releases the fragment scope after an adapter render error and can retry a valid replacement', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const bad = { type: 'fragment', root: { type: 'broken' } };
    const pending = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => pending.promise).mockResolvedValueOnce({ type: 'fragment', root: { type: 'text', props: { value: 'Recovered' } } });
    const { registry } = await mount(transport);
    registry.register('broken', ({ children: _children }: { children?: ReactNode }) => { throw new Error('Adapter failed'); });
    await act(async () => pending.resolve(bad));
    expect(container.textContent).toContain('Unable to render loaded content'); expect(fragments()).toEqual([]);
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Retry content')!.click());
    expect(container.textContent).toContain('Recovered'); expect(fragments()).toHaveLength(1);
  });
});



describe('remote acquisition ancestry', () => {
  it.each(['envelope', 'legacy'] as const)('contains a recursive %s source instead of expanding forever', async mode => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recursive = mode === 'envelope'
      ? { type: 'fragment', schemaSources: { again: { request: { path: '/api/fragment/one' }, load: { strategy: 'onDemand' } } }, root: { type: 'schema-outlet', source: 'again' } }
      : { type: 'schema-outlet', source: 'remote' };
    const transport = vi.fn<ApiTransport>(async () => recursive);
    await mount(transport);
    expect(container.textContent).toContain('Unable to render loaded content');
    expect(transport).toHaveBeenCalledTimes(2);
    expect(fragments()).toHaveLength(mode === 'envelope' ? 1 : 0);
    expect(environment.dependencyGraph.registrations()).toEqual([]);
  });
});

