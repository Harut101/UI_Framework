// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createFluentRoot } from './fluent-root';
import { createComponentRegistry } from '../src/components/registry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import type { ComponentDefinition, ViewDefinition } from '../src/runtime/shared/types';
import type { FragmentDefinition } from '../src/runtime/fragment/types';
import type { DefinitionCachePolicy, FragmentScopeLifetime } from '../src/runtime/schema/types';
import type { ApiTransport } from '../src/runtime/datasource/api';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let environment: RuntimeEnvironment;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); environment?.applicationScope?.dispose(); container.remove(); vi.restoreAllMocks(); });
const fragments = () => environment.listScopes().filter(scope => scope.type === 'fragment');
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }
function fragment(value = 'initial'): FragmentDefinition {
  return { type: 'fragment', state: { value }, actions: { edit: { type: 'state.set', target: 'value', value: 'edited' } }, root: { type: 'stack', children: [
    { type: 'text', bindings: { value: '$state.value' } }, { type: 'button', props: { label: 'Edit local' }, handlers: { onClick: { action: 'edit' } } },
  ] } };
}
function outlet(cache: DefinitionCachePolicy = 'view', scopeLifetime: FragmentScopeLifetime = 'activation'): ComponentDefinition {
  return { id: 'outlet', type: 'schema-outlet', enabled: '$state.enabled', key: '$state.selected', source: { request: { path: '/api/ui/$state.selected' }, cache }, lifecycle: { scopeLifetime } };
}
async function mount(transport: ApiTransport, node = outlet(), strict = false) {
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); const registry = createComponentRegistry();
  const definition: ViewDefinition = { id: 'inline-host', title: 'Inline', initialState: { enabled: true, selected: 'one' }, dataSources: {}, actions: {
    enable: { type: 'state.set', target: 'enabled', value: '$event.value' }, select: { type: 'state.set', target: 'selected', value: '$event.value' },
  }, root: node };
  const runtime = new ViewRuntime(definition, environment);
  const render = async (current: ComponentDefinition | null = node) => {
    const element = current && <Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={current}/></RuntimeContext.Provider></Provider>;
    await act(async () => root.render(strict ? <StrictMode>{element}</StrictMode> : element));
  };
  const set = async (name: 'enable' | 'select', value: boolean | string) => { await act(async () => runtime.actionEngine.execute(name, { event: { value } })); };
  await render(); return { runtime, render, set, registry };
}
const policies = (['none', 'scope', 'view', 'application'] as const).flatMap(cache => (['activation', 'outlet'] as const).map(lifetime => ({ cache, lifetime })));
describe('inline SchemaOutlet scope lifetimes', () => {
  it.each(policies)('$cache definitions / $lifetime scope: deactivation and real remount follow independent policies', async ({ cache, lifetime }) => {
    const transport = vi.fn<ApiTransport>(async () => fragment()); const { render, set } = await mount(transport, outlet(cache, lifetime));
    const first = fragments()[0];
    expect(first.origin).toMatchObject({ definitionCache: cache, scopeLifetime: lifetime, source: 'inline', key: 'one', requestPath: '/api/ui/one' });
    expect(first.origin?.cacheOwner).toBe(cache === 'application' ? first.applicationScopeId : cache === 'view' ? first.viewScopeId : first.parentScopeId);
    expect(Object.isFrozen(first.origin)).toBe(true);
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().fragments[first.scopeId].state.value).toBe('edited');
    await set('enable', false); expect(container.textContent).not.toContain('edited');
    expect(fragments()).toHaveLength(lifetime === 'outlet' ? 1 : 0);
    await set('enable', true);
    expect(fragments()).toHaveLength(1); expect(fragments()[0].scopeId === first.scopeId).toBe(lifetime === 'outlet');
    expect(container.textContent).toContain(lifetime === 'outlet' ? 'edited' : 'initial');
    const requests = cache === 'none' && lifetime === 'activation' ? 2 : 1;
    expect(transport).toHaveBeenCalledTimes(requests);
    const second = fragments()[0]; await render(null); expect(fragments()).toEqual([]); expect(environment.store.getState().fragments).toEqual({});
    await render(); expect(fragments()[0].scopeId).not.toBe(second.scopeId); expect(container.textContent).toContain('initial');
    expect(transport).toHaveBeenCalledTimes(requests + (cache === 'none' ? 1 : 0));
  });
  it('creates exactly one scope and definition request during StrictMode replay', async () => {
    const transport = vi.fn<ApiTransport>(async () => fragment()); await mount(transport, outlet('none', 'outlet'), true);
    expect(transport).toHaveBeenCalledTimes(1); expect(fragments()).toHaveLength(1);
    expect(environment.diagnostics.snapshot().filter(entry => entry.label === 'fragment initialized')).toHaveLength(1);
  });
  it('two simultaneous outlets share JSON and transport, never their local scope or state', async () => {
    const transport = vi.fn<ApiTransport>(async () => fragment());
    const nodes: ComponentDefinition = { id: 'pair', type: 'row', children: [{ ...outlet('application', 'outlet'), id: 'left' }, { ...outlet('application', 'outlet'), id: 'right' }] };
    const { set } = await mount(transport, nodes, true); const [a, b] = fragments(); expect(a.scopeId).not.toBe(b.scopeId); expect(transport).toHaveBeenCalledTimes(1);
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().fragments[a.scopeId].state.value).toBe('edited'); expect(environment.store.getState().fragments[b.scopeId].state.value).toBe('initial');
    await set('enable', false); await set('enable', true); expect(fragments().map(scope => scope.scopeId)).toEqual([a.scopeId, b.scopeId]);
  });
  it('key and source changes dispose retained owners; switching back creates a fresh scope', async () => {
    const transport = vi.fn<ApiTransport>(async () => fragment()); const node = outlet('application', 'outlet'); const { set, render } = await mount(transport, node);
    const first = fragments()[0]; await set('enable', false); await set('select', 'two'); expect(first.active()).toBe(false); expect(fragments()).toEqual([]);
    await set('select', 'one'); expect(fragments()).toEqual([]); // No resurrection while disabled.
    await set('enable', true); expect(fragments()[0].scopeId).not.toBe(first.scopeId); expect(transport).toHaveBeenCalledTimes(1);
    const next = fragments()[0]; await render({ ...node, source: { request: { path: '/api/other' }, cache: 'application' } });
    expect(next.active()).toBe(false); expect(fragments()).toHaveLength(1); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('replaces an activation when the resolved request changes without an explicit key', async () => {
    const old = deferred(); const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => old.promise).mockResolvedValueOnce(fragment('current'));
    const { set } = await mount(transport, { ...outlet(), key: null });
    await set('select', 'two'); expect(transport.mock.calls[0][1].aborted).toBe(true); expect(container.textContent).toContain('current');
    const scope = fragments()[0]; await act(async () => old.resolve(fragment('obsolete')));
    expect(fragments()[0]).toBe(scope); expect(container.textContent).not.toContain('obsolete');
  });
  it('aborts pending acquisition on deactivation and never creates a late scope', async () => {
    const old = deferred(); const transport = vi.fn<ApiTransport>(() => old.promise); const { set } = await mount(transport, outlet('application', 'outlet'));
    await set('enable', false); expect(transport.mock.calls[0][1].aborted).toBe(true);
    await act(async () => old.resolve(fragment())); expect(fragments()).toEqual([]); expect(environment.schemaCache.entries.size).toBe(0);
  });
  it('retries transport and fragment render failures locally without leaking scopes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const bad = deferred(); const transport = vi.fn<ApiTransport>().mockRejectedValueOnce(new Error('Offline')).mockImplementationOnce(() => bad.promise).mockResolvedValue(fragment('recovered'));
    const { registry } = await mount(transport, outlet('application', 'outlet'));
    registry.register('broken', () => { throw new Error('Adapter failed'); });
    expect(container.textContent).toContain('Unable to load content');
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Retry content')!.click());
    await act(async () => bad.resolve({ type: 'fragment', root: { type: 'broken' } }));
    expect(container.textContent).toContain('Unable to render loaded content'); expect(fragments()).toEqual([]);
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Retry content')!.click());
    expect(container.textContent).toContain('recovered'); expect(fragments()).toHaveLength(1);
  });
  it('evicting JSON alone does not dispose a retained live owner', async () => {
    const { set } = await mount(async () => fragment(), outlet('application', 'outlet')); const scope = fragments()[0];
    await set('enable', false);
    await act(async () => { for (const id of [...environment.schemaCache.entries.keys()]) environment.schemaCache.remove(id); });
    expect(scope.active()).toBe(true); await set('enable', true); expect(fragments()[0]).toBe(scope);
  });
  it('refreshing a disabled retained outlet disposes its scope without creating a hidden replacement', async () => {
    const transport = vi.fn<ApiTransport>(async () => fragment()); const node = outlet('application', 'outlet');
    const { set, runtime } = await mount(transport, node); const first = fragments()[0];
    await set('enable', false);
    await act(async () => {
      const lease = runtime.schemaFragments.reload(node.source!, 'one'); await lease.promise; lease.release();
    });
    expect(first.active()).toBe(false); expect(fragments()).toEqual([]);
    await set('enable', true); expect(fragments()).toHaveLength(1); expect(fragments()[0].scopeId).not.toBe(first.scopeId);
  });
  it('keeps legacy acquisition policy when a bare tree uses none cache and outlet lifetime', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ type: 'text', bindings: { value: '$state.selected' } }));
    const { set } = await mount(transport, outlet('none', 'outlet')); await set('enable', false); await set('enable', true);
    expect(transport).toHaveBeenCalledTimes(2); expect(fragments()).toEqual([]);
  });
  it('releasing one mounted outlet does not cancel another outlet awaiting the same request', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const left = { ...outlet(), id: 'left' }; const right = { ...outlet(), id: 'right' };
    const { render } = await mount(transport, { id: 'pair', type: 'stack', children: [left, right] });
    await render({ id: 'pair', type: 'stack', children: [right] });
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][1].aborted).toBe(false);
    await act(async () => pending.resolve(fragment())); expect(fragments()).toHaveLength(1); expect(container.textContent).toContain('initial');
  });
  it('legacy bare trees stay host-scoped with inline sources and outlet retention', async () => {
    const { set } = await mount(async () => ({ type: 'text', bindings: { value: '$state.selected' } }), outlet('view', 'outlet'));
    expect(fragments()).toEqual([]); expect(container.textContent).toContain('one'); await set('enable', false); await set('enable', true);
    expect(fragments()).toEqual([]); expect(environment.store.getState().viewState.selected).toBe('one');
  });
});

describe('recursive inline fragment ownership', () => {
  it('owns independent nested scopes, unmounts hidden descendants, reuses JSON, and recursively cancels on view disposal', async () => {
    const data = deferred();
    const outer: FragmentDefinition = { ...fragment('outer'), dataSources: { resource: { type: 'api', request: { method: 'GET', path: '/api/data/outer' }, load: { strategy: 'onInit' } } }, root: { type: 'stack', children: [
      { type: 'text', bindings: { value: '$state.value' } },
      { type: 'schema-outlet', source: { request: { path: '/api/ui/leaf' }, cache: 'application' }, lifecycle: { scopeLifetime: 'outlet' } },
      { type: 'schema-outlet', source: { request: { path: '/api/ui/leaf' }, cache: 'application' }, lifecycle: { scopeLifetime: 'outlet' } },
    ] } };
    const leaf: FragmentDefinition = { ...fragment('leaf'), dataSources: { resource: { type: 'api', request: { method: 'GET', path: '/api/data/leaf' }, dependsOn: ['$state.value'], load: { strategy: 'onInit', reload: 'onDependencyChange' } } } };
    const transport = vi.fn<ApiTransport>(async request => request.path.startsWith('/api/data/') ? data.promise : request.path === '/api/ui/leaf' ? leaf : outer);
    const { set, runtime } = await mount(transport, outlet('application', 'outlet'), true);
    const [parent, a, b] = fragments(); expect(fragments()).toHaveLength(3); expect(a.parentScope).toBe(parent); expect(b.parentScope).toBe(parent);
    expect(environment.dependencyGraph.registrations()).toHaveLength(3);
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().fragments[a.scopeId].state.value).toBe('edited'); expect(environment.store.getState().fragments[b.scopeId].state.value).toBe('leaf');
    await set('enable', false); expect(fragments()).toEqual([parent]); expect(a.active()).toBe(false); expect(b.active()).toBe(false);
    expect(transport.mock.calls.filter(([request]) => request.path === '/api/data/leaf').every(([, signal]) => signal.aborted)).toBe(true);
    expect(transport.mock.calls.find(([request]) => request.path === '/api/data/outer')![1].aborted).toBe(false);
    await set('enable', true); expect(fragments()).toHaveLength(3); expect(fragments()[1].scopeId).not.toBe(a.scopeId);
    expect(transport.mock.calls.filter(([request]) => request.path.startsWith('/api/ui/'))).toHaveLength(2);
    await act(async () => runtime.dispose()); expect(fragments()).toEqual([]); expect(environment.dependencyGraph.registrations()).toEqual([]);
    expect(environment.store.getState().fragments).toEqual({}); expect(transport.mock.calls.filter(([request]) => request.path.startsWith('/api/data/')).every(([, signal]) => signal.aborted)).toBe(true);
    expect(environment.schemaCache.entries.size).toBe(2); // Application JSON only; no live descendants.
    await act(async () => data.resolve({ value: 'late' })); expect(environment.store.getState().fragments).toEqual({});
    environment.applicationScope!.dispose(); expect(environment.schemaCache.entries.size).toBe(0);
  });
});


