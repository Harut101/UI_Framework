// @vitest-environment jsdom
import './fluent-setup';
import { act, type ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ApplicationHost } from '../src/runtime/application/ApplicationHost';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { validateApplicationDefinition, validateViewDefinition } from '../src/runtime/shared/validation';
import { validateFragmentDefinition } from '../src/runtime/fragment/normalizeFragmentDefinition';
import { PrimaryNavigation } from '../src/components/application/PrimaryNavigation';
import { createFluentRoot } from './fluent-root';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { ApplicationDefinition } from '../src/runtime/application/types';
import type { ViewDefinition } from '../src/runtime/view/types';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined, container: HTMLDivElement, environment: RuntimeEnvironment;
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; environment?.applicationScope?.dispose(); container?.remove(); });
function target() { container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container); }
const view = (id: string) => ({ id, title: id, initialState: {}, actions: {}, dataSources: {}, root: { id: 'text', type: 'text', props: { value: id } } });
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === text)!;
async function mountApp(transport: ApiTransport) {
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const definition: ApplicationDefinition = {
    id: 'reactive-source', initialState: { request: { path: '/api/ui/one', query: { tenant: 'a' } }, breadcrumbs: '' }, dataSources: {},
    actions: { change: { type: 'state.set', target: 'request', value: '$event.value' },
      loaded: { type: 'state.set', target: 'breadcrumbs', value: '$event.title' } },
    shell: { id: 'shell', type: 'container', children: [{ id: 'outlet', type: 'route-outlet' }] },
    routes: [], views: {}, viewSource: { request: '$appState.request', onLoaded: 'loaded' },
  };
  const registry = registerRouteOutlet(new ComponentRegistry()
    .register('container', ({ children }: { children?: ReactNode }) => <div data-shell>{children}</div>)
    .register('text', ({ value }: { value?: string }) => <p>{value}</p>)
    .register('spinner', () => <p>Loading</p>)
    .register('error-message', ({ text }: { text?: string }) => <p>{text}</p>));
  validateApplicationDefinition(definition, registry);
  const runtime = new ApplicationRuntime(definition, environment); runtime.start(); target();
  await act(async () => root!.render(<Provider store={environment.store}><MemoryRouter initialEntries={['/workspace']}><ApplicationHost definition={definition} views={{}} runtime={runtime} environment={environment} registry={registry}/></MemoryRouter></Provider>));
  return runtime;
}
describe('architecture audit acceptance regressions', () => {
  it('reloads a View on resolved app request changes at the same URL, without loops from onLoaded', async () => {
    const transport = vi.fn<ApiTransport>(async request => view(request.path + ':' + request.query?.tenant));
    const app = await mountApp(transport);
    expect(container.textContent).toBe('/api/ui/one:a'); expect(transport).toHaveBeenCalledTimes(1);
    const store = environment.store, shell = container.querySelector('[data-shell]'), old = environment.viewScope!;
    await act(async () => app.actionEngine.execute('change', { event: { value: { method: 'POST', path: '/api/ui/two', query: { tenant: 'b' }, body: { context: 'new' } } } }));
    expect(container.textContent).toBe('/api/ui/two:b'); expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][0]).toMatchObject({ method: 'POST', path: '/api/ui/two', body: { context: 'new' } });
    expect(old.active()).toBe(false); expect(environment.store).toBe(store); expect(container.querySelector('[data-shell]')).toBe(shell);
    await act(async () => app.actionEngine.execute('change', { event: { value: { path: '/api/ui/two', query: { tenant: 'c' } } } }));
    expect(container.textContent).toBe('/api/ui/two:c'); expect(transport).toHaveBeenCalledTimes(3);
    expect(environment.store.getState().appState.breadcrumbs).toBe('/api/ui/two:c');
  });
  it('cancels a superseded request and rejects its late response while staying at the same URL', async () => {
    let finish!: (value: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    const transport = vi.fn<ApiTransport>(async request => request.path === '/api/ui/slow' ? pending : view(request.path));
    const app = await mountApp(transport);
    await act(async () => app.actionEngine.execute('change', { event: { value: { path: '/api/ui/slow' } } }));
    const signal = transport.mock.calls.at(-1)![1];
    await act(async () => app.actionEngine.execute('change', { event: { value: { path: '/api/ui/current' } } }));
    expect(signal.aborted).toBe(true); expect(container.textContent).toBe('/api/ui/current');
    await act(async () => finish(view('obsolete')));
    expect(container.textContent).toBe('/api/ui/current'); expect(environment.viewScope?.definition.id).toBe('/api/ui/current');
  });
  it('rejects handler/binding collisions in View and Fragment validation', () => {
    const registry = new ComponentRegistry().register('probe', () => null);
    const node = { id: 'probe', type: 'probe', bindings: { onClick: '$state.label' }, handlers: { onClick: { action: 'click' } } };
    const actions = { click: { type: 'state.set' as const, target: 'clicked', value: true } };
    expect(() => validateViewDefinition({ ...view('invalid'), root: node, actions }, registry)).toThrow('bindings.onClick');
    expect(() => validateFragmentDefinition({ type: 'fragment', root: node, actions }, registry)).toThrow('bindings.onClick');
  });
  it('preserves generated callbacks defensively for an unvalidated programmatic tree', async () => {
    let received: unknown;
    const registry = new ComponentRegistry().register('probe', (props: { onClick?: unknown }) => { received = props.onClick; return null; });
    const definition: ViewDefinition = { id: 'guard', title: 'Guard', initialState: { label: 'not a callback' }, dataSources: {},
      actions: { click: { type: 'state.set', target: 'clicked', value: true } },
      root: { id: 'probe', type: 'probe', bindings: { onClick: '$state.label' }, handlers: { onClick: { action: 'click' } } } };
    environment = new RuntimeEnvironment(vi.fn(), vi.fn(), vi.fn()); const runtime = new ViewRuntime(definition, environment); target();
    await act(async () => root!.render(<Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={definition.root}/></RuntimeContext.Provider></Provider>));
    expect(typeof received).toBe('function');
    await act(async () => (received as () => void)()); expect(environment.store.getState().viewState.clicked).toBe(true);
  });
  it('selects a parent destination separately from controlled expansion and has no embedded branding', async () => {
    const onSelect = vi.fn(), onExpandedChange = vi.fn(); target();
    const items = [{ id: 'parent', label: 'Parent', href: '/overview', children: [{ id: 'child', label: 'Child', href: '/child' }] }];
    const render = async (expandedIds: string[], caption?: string, footerText?: string) => act(async () => root!.render(
      <PrimaryNavigation items={items} expandedIds={expandedIds} onSelect={onSelect} onExpandedChange={onExpandedChange} caption={caption} footerText={footerText}/>));
    await render([]);
    expect(container.textContent).not.toMatch(/GUARDIAN|Connected demo/);
    await act(async () => button('Parent').click());
    expect(onSelect).toHaveBeenCalledWith({ value: 'parent', href: '/overview' }); expect(onExpandedChange).not.toHaveBeenCalled();
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Expand Parent"]')!.click());
    expect(onExpandedChange).toHaveBeenCalledWith({ value: ['parent'] }); expect(onSelect).toHaveBeenCalledTimes(1);
    await render(['parent'], 'Custom workspace', 'Offline');
    expect(container.textContent).toContain('Custom workspace'); expect(container.textContent).toContain('Offline');
    await act(async () => button('Child').click()); expect(onSelect).toHaveBeenLastCalledWith({ value: 'child', href: '/child' });
    await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Collapse Parent"]')!.click());
    expect(onExpandedChange).toHaveBeenLastCalledWith({ value: [] });
    await render([], 'Another workspace', 'Connecting');
    expect(container.textContent).not.toContain('Offline'); expect(container.textContent).toContain('Another workspace');
  });
});
