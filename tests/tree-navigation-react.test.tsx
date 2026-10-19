// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createFluentRoot } from './fluent-root';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { PrimaryNavigation } from '../src/components/application/PrimaryNavigation';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import type { ViewDefinition, ComponentDefinition, JsonValue } from '../src/runtime/shared/types';
import type { TreeDataNode } from '../src/contracts/tree';
import type { ApiTransport } from '../src/runtime/datasource/api';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let environment: RuntimeEnvironment;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); environment?.applicationScope?.dispose(); container.remove(); vi.restoreAllMocks(); });
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }
const link = (id: string, name = id): TreeDataNode => ({ id, name, href: '/destination/' + id });
const button = (label: string) => [...container.querySelectorAll('button')].find(node => node.textContent === label)!;
const click = async (label: string) => { expect(button(label)).toBeDefined(); await act(async () => button(label).click()); };
async function mount(items: TreeDataNode[], transport: ApiTransport = vi.fn(async () => ({ items: [] })), strict = false, pair = false) {
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); const registry = registerApplicationComponents(createComponentRegistry());
  const tree: ComponentDefinition = { id: 'tree', type: 'data-tree', props: { component: 'primary-navigation', items: items as unknown as JsonValue },
    bindings: { selectedId: '$state.selected', expandedIds: { source: '$state.expanded', default: [] } }, handlers: { onSelect: { action: 'select' }, onExpandedChange: { action: 'expand' } } };
  const definition: ViewDefinition = { id: 'navigation-test', title: 'Tree', initialState: { expanded: [], selected: '', query: 'one' }, dataSources: {}, actions: {
    expand: { type: 'state.set', target: 'expanded', value: '$event.value' }, select: { type: 'sequence', actions: ['remember', 'navigate'] }, remember: { type: 'state.set', target: 'selected', value: '$event.value' }, navigate: { type: 'navigate', to: '$event.href' }, query: { type: 'state.set', target: 'query', value: '$event.value' },
  }, root: pair ? { id: 'pair', type: 'stack', children: [tree, { ...tree, id: 'second-tree' }] } : tree };
  const runtime = new ViewRuntime(definition, environment);
  const render = async (node = definition.root) => {
    const element = <Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={node}/></RuntimeContext.Provider></Provider>;
    await act(async () => root.render(strict ? <StrictMode>{element}</StrictMode> : element));
  };
  await render(); return { runtime, render, tree };
}

describe('data-driven navigation through real runtime layers', () => {
  it('renders static children with zero HTTP and preserves named selection/navigation actions', async () => {
    const transport = vi.fn<ApiTransport>(); await mount([{ ...link('group', 'Static'), links: [link('one', 'First')] }], transport);
    await click('Static'); expect(container.textContent).toContain('First'); expect(transport).not.toHaveBeenCalled();
    await click('First'); expect(environment.store.getState().viewState.selected).toBe('one'); expect(environment.navigate).toHaveBeenCalledWith('/destination/one');
    expect(button('First').getAttribute('aria-current')).toBe('page'); expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('loads remote children DATA using Guardian URLs only when expanded', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ items: [link('remote', 'Loaded link')] }));
    await mount([{ ...link('group', 'Remote'), childLinksSourceUrl: 'v0/arbitrary/entities' }], transport);
    expect(transport).not.toHaveBeenCalled(); await click('Remote'); expect(transport.mock.calls[0][0]).toMatchObject({ path: '/api/v0/arbitrary/entities', method: 'GET' });
    expect(container.textContent).toContain('Loaded link'); expect(environment.store.getState().schemaFragments).toEqual({});
    await click('Remote'); await click('Remote'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('shows static children during loading, deduplicates remote ids and applies hybrid ordering', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    await mount([{ ...link('group', 'Hybrid'), links: [link('a', 'Static A'), link('b', 'Static B')], childrenSource: { request: { path: '/api/children' } }, childrenOrders: ['c', 'a', 'b'] }], transport);
    await click('Hybrid'); expect(container.textContent).toContain('Static A'); expect(container.textContent).toContain('Loading Hybrid');
    await act(async () => pending.resolve({ items: [link('c', 'Remote C'), link('a', 'Updated A')] }));
    expect([...container.querySelectorAll('.application-nav-children button')].map(node => node.textContent)).toEqual(['Remote C', 'Updated A', 'Static B']);
    expect(container.textContent).not.toContain('Static A'); expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('cancels collapsed requests and rejects stale responses after reopening', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => pending.promise).mockResolvedValueOnce({ items: [link('new', 'Current')] });
    await mount([{ ...link('group', 'Remote'), childrenSource: { request: { path: '/api/children' } } }], transport);
    await click('Remote'); await click('Remote'); expect(transport.mock.calls[0][1].aborted).toBe(true);
    await click('Remote'); expect(container.textContent).toContain('Current'); await act(async () => pending.resolve({ items: [link('old', 'Obsolete')] }));
    expect(container.textContent).not.toContain('Obsolete'); expect(container.textContent).toContain('Current');
  });
  it('contains child errors, retains static items and retries through DataSourceManager', async () => {
    const transport = vi.fn<ApiTransport>().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ items: [link('remote', 'Recovered')] });
    await mount([{ ...link('group', 'Hybrid'), links: [link('static', 'Still available')], childrenSource: { request: { path: '/api/children' } } }], transport);
    await click('Hybrid'); expect(container.textContent).toContain('Unable to load Hybrid'); expect(container.textContent).toContain('Still available');
    await click('Retry Hybrid'); expect(container.textContent).toContain('Recovered'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('uses scope-aware request expressions and replaces a pending request when they change', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => pending.promise).mockResolvedValueOnce({ items: [link('two', 'Second')] });
    const { runtime } = await mount([{ ...link('group', 'Scoped'), childrenSource: { request: { path: '/api/entities/$state.query', query: { search: '$state.query' } } } }], transport);
    await click('Scoped'); await act(async () => runtime.actionEngine.execute('query', { event: { value: 'two' } }));
    expect(transport.mock.calls[0][1].aborted).toBe(true); expect(transport.mock.calls[1][0]).toMatchObject({ path: '/api/entities/two', query: { search: 'two' } });
    await act(async () => pending.resolve({ items: [link('old', 'Old')] })); expect(container.textContent).toContain('Second'); expect(container.textContent).not.toContain('Old');
  });
  it('deduplicates StrictMode and simultaneous consumers without aborting a surviving tree', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { render, tree } = await mount([{ ...link('group', 'Shared'), childrenSource: { request: { path: '/api/shared' } } }], transport, true, true);
    await click('Shared'); expect(transport).toHaveBeenCalledTimes(1);
    await render(tree); expect(transport.mock.calls[0][1].aborted).toBe(false);
    await act(async () => pending.resolve({ items: [link('shared', 'Shared link')] })); expect(container.textContent).toContain('Shared link'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('recursively expands returned child data without requesting UI schema', async () => {
    const transport = vi.fn<ApiTransport>(async request => request.path === '/api/outer' ? { items: [{ ...link('inner', 'Inner'), childrenSource: { request: { path: '/api/inner' } } }] } : { items: [link('leaf', 'Leaf')] });
    await mount([{ ...link('outer', 'Outer'), childrenSource: { request: { path: '/api/outer' } } }], transport);
    await click('Outer'); expect(transport).toHaveBeenCalledTimes(1); await click('Inner'); expect(container.textContent).toContain('Leaf'); expect(transport).toHaveBeenCalledTimes(2);
    await click('Leaf'); expect(environment.navigate).toHaveBeenCalledWith('/destination/leaf'); expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('aborts node requests and clears their Redux data with the owning scope', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { runtime } = await mount([{ ...link('group', 'Remote'), childrenSource: { request: { path: '/api/children' } } }], transport);
    await click('Remote'); await act(async () => runtime.dispose()); expect(transport.mock.calls[0][1].aborted).toBe(true);
    await act(async () => pending.resolve({ items: [link('late')] })); expect(environment.store.getState().viewData).toEqual({});
  });
  it('PrimaryNavigation renders and emits callbacks without a Redux provider or runtime', async () => {
    const onSelect = vi.fn(); const onExpandedChange = vi.fn();
    await act(async () => root.render(<PrimaryNavigation items={[{ id: 'group', label: 'Group', expandable: true }, { id: 'leaf', label: 'Leaf', href: '/leaf' }]} expandedIds={[]} onSelect={onSelect} onExpandedChange={onExpandedChange}/>));
    await click('Group'); expect(onExpandedChange).toHaveBeenCalledWith({ value: ['group'] }); await click('Leaf'); expect(onSelect).toHaveBeenCalledWith({ value: 'leaf', href: '/leaf' });
  });
});
