// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode, useEffect, useLayoutEffect, type ReactNode } from 'react';
import type {Root} from 'react-dom/client';
import {createFluentRoot as createRoot} from './fluent-root';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ApplicationHost } from '../src/runtime/application/ApplicationHost';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { helloViewDefinition } from '../src/schemas';
import { createComponentRegistry } from '../src/components/registry';
import { Playground } from '../src/playground/Playground';
import type { ApplicationDefinition, ViewDefinition } from '../src/runtime/shared/types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
const cleanups: (() => void)[] = [];
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); cleanups.splice(0).forEach(cleanup => cleanup()); container.remove(); vi.unstubAllGlobals(); });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('React runtime integration', () => {
  it('does not render a node when unrelated Redux state changes', async () => {
    const renders = { selected: 0, other: 0 };
    function Selected({ value }: { value: string }) { renders.selected++; return <span>{value}</span>; }
    function Other({ value }: { value: string }) { renders.other++; return <span>{value}</span>; }
    const registry = new ComponentRegistry().register('stack', ({ children }: { children?: ReactNode }) => <div>{children}</div>).register('selected', Selected).register('other', Other);
    const definition: ViewDefinition = { id: 'isolation', title: 'Isolation', initialState: { selected: 'initial', other: 'initial' }, dataSources: {}, actions: {
      changeOther: { type: 'state.set', target: 'other', value: 'changed' }, changeSelected: { type: 'state.set', target: 'selected', value: 'changed' },
    }, root: { id: 'root', type: 'stack', children: [
      { id: 'selected', type: 'selected', bindings: { value: '$state.selected' } },
      { id: 'other', type: 'other', bindings: { value: '$state.other' } },
    ] } };
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), async () => null);
    const runtime = new ViewRuntime(definition, environment); cleanups.push(() => runtime.dispose());
    const context = { runtime, registry };
    await act(async () => root.render(<Provider store={environment.store}><RuntimeContext.Provider value={context}><RuntimeNode definition={definition.root}/></RuntimeContext.Provider></Provider>));
    expect(renders).toEqual({ selected: 1, other: 1 });
    await act(async () => runtime.actionEngine.execute('changeOther'));
    expect(renders).toEqual({ selected: 1, other: 2 });
    await act(async () => runtime.actionEngine.execute('changeSelected'));
    expect(renders).toEqual({ selected: 2, other: 2 });
  });
  it('keeps the shell mounted and cancels the old view on actual router navigation', async () => {
    let mounts = 0; let unmounts = 0;
    function Shell({ children }: { children?: ReactNode }) { useEffect(() => { mounts++; return () => { unmounts++; }; }, []); return <div>{children}</div>; }
    function View({ value }: { value: string }) { return <p>{value}</p>; }
    const registry = registerRouteOutlet(new ComponentRegistry().register('shell', Shell).register('view', View));
    const makeView = (id: string): ViewDefinition => ({ id, title: id, initialState: { filter: id }, actions: {}, dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items' }, load: { strategy: 'onViewInit' } } }, root: { id: 'view', type: 'view', bindings: { value: '$state.filter' } } });
    const definition: ApplicationDefinition = { id: 'app', initialState: { persistent: true }, dataSources: {}, actions: { go: { type: 'navigate', to: '$event.value' } }, shell: { id: 'shell', type: 'shell', children: [{ id: 'outlet', type: 'route-outlet' }] }, routes: [{ path: '/one', viewId: 'one' }, { path: '/two', viewId: 'two' }], views: { one: makeView('one'), two: makeView('two') } };
    let navigateTo: ((to: string) => void) | undefined;
    function Bridge() { const navigate = useNavigate(); useLayoutEffect(() => { navigateTo = navigate; }, [navigate]); return null; }
    const signals: AbortSignal[] = [];
    const environment = new RuntimeEnvironment(to => navigateTo?.(to), vi.fn(), (_request, signal) => { signals.push(signal); return new Promise(() => undefined); });
    const runtime = new ApplicationRuntime(definition, environment); cleanups.push(() => runtime.dispose());
    await act(async () => root.render(<Provider store={environment.store}><MemoryRouter initialEntries={['/one']}><Bridge/><ApplicationHost definition={definition} views={definition.views} environment={environment} runtime={runtime} registry={registry} revision={0}/></MemoryRouter></Provider>));
    const firstInstance = environment.store.getState().viewInstance;
    expect(container.textContent).toBe('one'); expect(mounts).toBe(1);
    await act(async () => runtime.actionEngine.execute('go', { event: { value: '/two' } }));
    expect(container.textContent).toBe('two'); expect(environment.store.getState().viewInstance).not.toBe(firstInstance);
    expect(signals[0].aborted).toBe(true); expect(signals[1].aborted).toBe(false);
    expect(environment.store.getState().appState.persistent).toBe(true);
    expect(mounts).toBe(1); expect(unmounts).toBe(0);
  });
  it('renders the JSON text/button slice through the real store and named action', async () => {
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), async () => null);
    const runtime = new ViewRuntime(helloViewDefinition, environment); cleanups.push(() => runtime.dispose());
    const context = { runtime, registry: createComponentRegistry() };
    await act(async () => root.render(<Provider store={environment.store}><RuntimeContext.Provider value={context}><RuntimeNode definition={helloViewDefinition.root}/></RuntimeContext.Provider></Provider>));
    expect(container.querySelector('p')?.textContent).toBe('Waiting for a named action.');
    expect(environment.store.getState().viewState.message).toBe('Waiting for a named action.');
    await act(async () => { container.querySelector<HTMLButtonElement>('button')!.click(); await tick(); });
    expect(environment.store.getState().viewState.message).toBe('Updated through the runtime.');
    expect(container.querySelector('p')?.textContent).toBe('Updated through the runtime.');
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ kind: 'action', label: 'showMessage', detail: 'state.set' }));
  });
  it('disposes and reinitializes a view when the route changes while reusing the same view definition', async () => {
    let mounts = 0;
    function Shell({ children }: { children?: ReactNode }) { useEffect(() => { mounts++; }, []); return <main>{children}</main>; }
    const registry = registerRouteOutlet(createComponentRegistry().register('shell', Shell));
    const view: ViewDefinition = { ...helloViewDefinition, dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items' }, dependsOn: ['$state.message'], load: { strategy: 'onViewInit', reload: 'onDependencyChange', debounceMs: 100 } } } };
    const definition: ApplicationDefinition = { id: 'app', initialState: { message: 'Application message' }, dataSources: {}, actions: { go: { type: 'navigate', to: '$event.value' } }, shell: { id: 'shell', type: 'shell', children: [{ id: 'app-message', type: 'text', bindings: { value: '$appState.message' } }, { id: 'outlet', type: 'route-outlet' }] }, routes: [{ path: '/item/:id', viewId: 'shared' }], views: { shared: view } };
    let navigateTo: ((to: string) => void) | undefined;
    function Bridge() { const navigate = useNavigate(); useLayoutEffect(() => { navigateTo = navigate; }, [navigate]); return null; }
    const signals: AbortSignal[] = [];
    const environment = new RuntimeEnvironment(to => navigateTo?.(to), vi.fn(), (_request, signal) => { signals.push(signal); return new Promise(() => undefined); });
    const runtime = new ApplicationRuntime(definition, environment); cleanups.push(() => runtime.dispose());
    await act(async () => root.render(<Provider store={environment.store}><MemoryRouter initialEntries={['/item/one']}><Bridge/><ApplicationHost definition={definition} views={definition.views} environment={environment} runtime={runtime} registry={registry}/></MemoryRouter></Provider>));
    const first = environment.store.getState().viewInstance;
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(container.textContent).toContain('Updated through the runtime.');
    expect(signals[0].aborted).toBe(true);
    await act(async () => runtime.actionEngine.execute('go', { event: { value: '/item/two' } }));
    expect(environment.store.getState().viewInstance).not.toBe(first);
    expect(environment.store.getState().viewState.message).toBe('Waiting for a named action.');
    expect(environment.store.getState().appState.message).toBe('Application message');
    expect(mounts).toBe(1);
    expect(signals).toHaveLength(2);
    expect(signals[1].aborted).toBe(false);
  });
  it('survives React effect replay and exposes exactly the three initial tabs', async () => {
    const fetchSpy = vi.fn(async (_input: unknown, _init?: unknown) => ({ ok: true, json: async () => ({ items: [], total: 0, subtitle: '0 report definitions' }) })); vi.stubGlobal('fetch', fetchSpy);
    await act(async () => { root.render(<StrictMode><MemoryRouter initialEntries={['/schema']}><Playground/></MemoryRouter></StrictMode>); await tick(); });
    expect([...container.querySelectorAll('nav [role=tab]')].map(link => link.querySelector('.fui-Tab__content')?.textContent)).toEqual(['Components', 'Schema Playground', 'Full Application']);
    const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent === 'Update message');
    await act(async () => { button!.click(); await tick(); });
    expect(container.querySelector('.runtime-page > p')?.textContent).toBe('Updated through the runtime.');
    await act(async () => { [...container.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(tab=>tab.querySelector('.fui-Tab__content')?.textContent==='Full Application')!.click(); await tick(); });
    expect(container.querySelector('h1')?.textContent).toBe('Full Application');
    expect(container.querySelector('.runtime-page')).toBeNull();
    await act(async () => { [...container.querySelectorAll<HTMLButtonElement>('[role=tab]')].find(tab=>tab.querySelector('.fui-Tab__content')?.textContent==='Components')!.click(); await tick(); });
    expect(container.querySelector('h1')?.textContent).toBe('Components');
    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy.mock.calls.some(call => String(call[0]).includes('/api/app/navigation'))).toBe(true);
  });
});
