import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeTreeNodes, projectDataTree, readTreeNodes } from '../src/runtime/data-tree/treeData';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { FragmentRuntime } from '../src/runtime/fragment/FragmentRuntime';
import { createComponentRegistry } from '../src/components/registry';
import { inlineSourceId } from '../src/runtime/datasource/inlineRequest';
import type { TreeDataNode } from '../src/contracts/tree';
import type { ApiTransport } from '../src/runtime/datasource/api';
const environments: RuntimeEnvironment[] = [];
afterEach(() => environments.splice(0).forEach(env => env.applicationScope?.dispose()));
function setup(transport: ApiTransport = vi.fn(async () => ({ items: [] }))) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport); environments.push(environment);
  const runtime = new ViewRuntime({ id: 'tree-test', title: 'Tree', initialState: { query: 'local' }, actions: {}, dataSources: {}, root: { id: 'root', type: 'text' } }, environment);
  return { environment, runtime, transport };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }
const link = (id: string, name = id): TreeDataNode => ({ id, name, href: '/destination' });

describe('tree DATA contracts and generic merge', () => {
  it('supports static children with no source or request', () => {
    const { environment, runtime } = setup();
    const nodes = readTreeNodes([{ id: 'group', name: 'Group', links: [link('a')] }]);
    const result = projectDataTree(nodes, ['group'], {}, environment.resolver, { scope: runtime, state: environment.store.getState() });
    expect(result.requests).toEqual([]); expect(result.items[0].children[0]).toMatchObject({ id: 'a', label: 'a' });
  });
  it('merges static and remote children without mutation, deduplicates ids and applies explicit order', () => {
    const initial = [link('a', 'Old'), link('b')]; const remote = [link('c'), link('a', 'Updated'), link('c', 'Latest')];
    const result = mergeTreeNodes(initial, remote, ['c', 'missing', 'c', 'a']);
    expect(result.map(item => item.id)).toEqual(['c', 'a', 'b']); expect(result[0].name).toBe('Latest'); expect(result[1].label).toBe('Updated'); expect(initial[0].name).toBe('Old'); expect(remote).toHaveLength(3);
  });
  it('retains nested static links when remote metadata updates their parent', () => {
    const result = mergeTreeNodes([{ ...link('a'), links: [link('one')] }], [{ ...link('a', 'Updated'), links: [link('two')] }]);
    expect(result[0].links?.map(node => node.id)).toEqual(['one', 'two']);
  });
  it('keeps stable insertion order for unordered children', () => {
    expect(mergeTreeNodes([link('z'), link('a')], [link('b'), link('a')]).map(node => node.id)).toEqual(['z', 'a', 'b']);
  });
  it('normalizes Guardian child URLs and lets a node-local source override the URL', () => {
    const { environment, runtime } = setup();
    const nodes = readTreeNodes([{ ...link('url'), childLinksSourceUrl: 'v0/entities' }, { ...link('source'), childLinksSourceUrl: 'v0/unused', childrenSource: { request: { path: '/api/custom/$state.query', query: { query: '$state.query' } } } }]);
    const result = projectDataTree(nodes, ['url', 'source'], {}, environment.resolver, { scope: runtime, state: environment.store.getState() });
    expect(result.requests.map(resource => resource.request.path)).toEqual(['/api/v0/entities', '/api/custom/local']); expect(result.requests[1].request.query).toEqual({ query: 'local' });
    expect(projectDataTree(nodes, [], {}, environment.resolver, { scope: runtime, state: environment.store.getState() }).requests).toEqual([]);
  });
  it('supports remote-only data and configured response paths', () => {
    const { environment, runtime } = setup(); const nodes = readTreeNodes([{ ...link('remote'), childrenSource: { request: { path: '/api/tree' }, itemsPath: 'result.links' } }]);
    const id = inlineSourceId({ method: 'GET', path: '/api/tree' });
    const result = projectDataTree(nodes, ['remote'], { [id]: { status: 'success', loading: false, error: null, data: { result: { links: [link('loaded')] } } } }, environment.resolver, { scope: runtime, state: environment.store.getState() });
    expect(result.items[0].children.map(item => item.id)).toEqual(['loaded']); expect(result.items[0].childrenError).toBeNull();
  });
  it('contains malformed remote data at its parent while retaining static links', () => {
    const { environment, runtime } = setup(); const nodes = [{ ...link('group'), links: [link('static')], childrenSource: { request: { path: '/api/tree' } } }];
    const id = inlineSourceId({ path: '/api/tree', method: 'GET' });
    const result = projectDataTree(nodes, ['group'], { [id]: { status: 'success', loading: false, error: null, data: { items: [{ bad: true }] } } }, environment.resolver, { scope: runtime, state: environment.store.getState() });
    expect(result.items[0].childrenError).toContain('require id'); expect(result.items[0].children.map(item => item.id)).toEqual(['static']);
  });
  it.each([null, {}, [{ id: 'a' }], [{ ...link('a'), childrenOrders: [1] }], [{ ...link('a'), childrenSource: { request: { path: 'https://example.test' } } }]])('rejects malformed tree data %j', value => {
    expect(() => readTreeNodes(value)).toThrow();
  });
});

describe('node-local leases through the existing DataSourceManager', () => {
  it('uses order-independent identities with safe Redux path keys', () => {
    const a = inlineSourceId({ method: 'GET', path: '/api/a.b', query: { a: 'x.y', b: true } });
    const b = inlineSourceId({ query: { b: true, a: 'x.y' }, path: '/api/a.b', method: 'GET' });
    expect(a).toBe(b); expect(a).not.toContain('.');
  });
  it('deduplicates leases and reuses successful data until the owning scope ends', async () => {
    const { environment, runtime, transport } = setup(); const request = { method: 'GET' as const, path: '/api/entities' };
    const a = runtime.dataSources.acquireInline(request); const b = runtime.dataSources.acquireInline(request); await tick();
    expect(a.id).toBe(b.id); expect(transport).toHaveBeenCalledTimes(1); expect(environment.store.getState().viewData[a.id].status).toBe('success');
    a.release(); b.release(); await tick(); const c = runtime.dataSources.acquireInline(request); await tick(); expect(transport).toHaveBeenCalledTimes(1); c.release();
    runtime.dispose(); expect(environment.store.getState().viewData).toEqual({});
  });
  it('cancels only the last pending consumer and rejects an ignored-abort response', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise); const { environment, runtime } = setup(transport);
    const a = runtime.dataSources.acquireInline({ method: 'GET', path: '/api/entities' }); const b = runtime.dataSources.acquireInline({ method: 'GET', path: '/api/entities' }); await tick();
    a.release(); await tick(); expect(transport.mock.calls[0][1].aborted).toBe(false); b.release(); await tick(); expect(transport.mock.calls[0][1].aborted).toBe(true);
    pending.resolve({ items: [link('late')] }); await tick(); expect(environment.store.getState().viewData[a.id]).toMatchObject({ status: 'idle', data: null });
  });
  it('isolates identical inline resources across fragment scopes and recursively aborts on parent disposal', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise); const { environment, runtime } = setup(transport); const registry = createComponentRegistry();
    const a = new FragmentRuntime({ type: 'fragment', root: { type: 'text' } }, runtime, registry); const b = new FragmentRuntime({ type: 'fragment', root: { type: 'text' } }, runtime, registry);
    const leaseA = a.scope.dataSources.acquireInline({ method: 'GET', path: '/api/entities' }); const leaseB = b.scope.dataSources.acquireInline({ method: 'GET', path: '/api/entities' }); await tick();
    expect(transport).toHaveBeenCalledTimes(2); a.dispose(); expect(transport.mock.calls[0][1].aborted).toBe(true); expect(transport.mock.calls[1][1].aborted).toBe(false);
    expect(environment.store.getState().fragments[b.scopeId].data[leaseB.id].status).toBe('loading'); runtime.dispose(); expect(transport.mock.calls[1][1].aborted).toBe(true);
    pending.resolve({ items: [] }); await tick(); expect(environment.store.getState().fragments).toEqual({}); expect(leaseA.id).toBe(leaseB.id);
  });
});

