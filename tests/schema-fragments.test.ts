import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { createComponentRegistry } from '../src/components/registry';
import { validateFragment, validateViewDefinition } from '../src/runtime/shared/validation';
import type { ComponentDefinition, ViewDefinition, ApplicationDefinition } from '../src/runtime/shared/types';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { SchemaSourceDefinition } from '../src/runtime/schema/types';
const registry = createComponentRegistry();
const fragment: ComponentDefinition = { id: 'remote', type: 'text', props: { value: 'Remote content' } };
function definition(cache: SchemaSourceDefinition['load']['cache'] = 'view'): ViewDefinition {
  return { id: 'dynamic', title: 'Dynamic', initialState: { selected: 'one', enabled: true }, actions: { select: { type: 'state.set', target: 'selected', value: '$event.value' } }, dataSources: {}, schemaSources: { content: { request: { path: '/api/ui/$state.selected', query: { tenant: '$appState.tenant' } }, load: { strategy: 'onDemand', cache } } }, root: { id: 'outlet', type: 'schema-outlet', source: 'content', key: '$state.selected', enabled: '$state.enabled' } };
}
const runtimes: (ViewRuntime | ApplicationRuntime)[] = [];
afterEach(() => { runtimes.splice(0).reverse().forEach(runtime => runtime.dispose()); });
function setup(cache: SchemaSourceDefinition['load']['cache'] = 'view', transport: ApiTransport = vi.fn(async () => fragment)) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const view = definition(cache); const runtime = new ViewRuntime(view, environment); runtimes.push(runtime);
  const validate = (value: unknown): asserts value is ComponentDefinition => validateFragment(value, view, registry);
  return { environment, runtime, transport, validate, load: (key: string | null = 'one') => runtime.schemaFragments.acquire('content', key, validate) };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { resolve, promise }; }

describe('SchemaFragmentManager', () => {
  it('publishes loading then a validated fragment to internal Redux, never $data', async () => {
    const { load, environment } = setup(); const lease = load();
    expect(environment.store.getState().schemaFragments[lease.id]).toMatchObject({ status: 'loading', loading: true, schema: null });
    await lease.promise;
    expect(environment.store.getState().schemaFragments[lease.id]).toMatchObject({ status: 'success', loading: false, schema: fragment });
    expect(environment.store.getState().viewData).toEqual({}); lease.release();
  });
  it('deduplicates concurrent outlets and keeps the request while another consumer remains', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { load } = setup('view', transport); const first = load(); const second = load();
    expect(first.promise).toBe(second.promise); await tick(); first.release(); await tick();
    expect(transport).toHaveBeenCalledTimes(1); expect(transport.mock.calls[0][1].aborted).toBe(false);
    pending.resolve(fragment); await second.promise; second.release();
  });
  it('keeps different keys in independent cache entries', async () => {
    const { load, environment, transport } = setup(); const one = load('one'); const two = load('two');
    await Promise.all([one.promise, two.promise]); expect(one.id).not.toBe(two.id);
    expect(Object.keys(environment.store.getState().schemaFragments)).toHaveLength(2); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('reuses view cache across repeated activations', async () => {
    const { load, transport } = setup(); const first = load(); await first.promise; first.release(); await tick();
    const second = load(); await second.promise; expect(transport).toHaveBeenCalledTimes(1); second.release();
  });
  it('none cache reloads on activation and clears on release', async () => {
    const { load, transport, environment } = setup('none'); const first = load(); await first.promise; first.release(); await tick();
    expect(environment.store.getState().schemaFragments).toEqual({}); const second = load(); await second.promise; expect(transport).toHaveBeenCalledTimes(2);
  });
  it('clears view fragments and aborts pending requests on ViewRuntime.dispose', async () => {
    const transport = vi.fn<ApiTransport>(() => new Promise(() => undefined));
    const { load, runtime, environment } = setup('view', transport); load(); await tick(); runtime.dispose();
    expect(transport.mock.calls[0][1].aborted).toBe(true); expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('preserves application-source cache across view changes and clears it with the application', async () => {
    const { runtime, environment, validate } = setup();
    const app: ApplicationDefinition = { id: 'host', initialState: {}, dataSources: {}, actions: {}, schemaSources: { shared: { request: { path: '/api/ui/shared' }, load: { strategy: 'onDemand', cache: 'application' } } }, shell: fragment, viewSource: { request: { path: "/api/ui/views" } } };
    const host = new ApplicationRuntime(app, environment); runtimes.push(host);
    const lease = host.schemaFragments.acquire('shared', null, validate); await lease.promise; lease.release();
    runtime.dispose(); const next = new ViewRuntime(definition(), environment); runtimes.push(next);
    expect(environment.store.getState().schemaFragments[lease.id]?.schema).toEqual(fragment);
    const again = host.schemaFragments.acquire('shared', null, validate); await again.promise;
    expect(environment.transport).toHaveBeenCalledTimes(1); host.dispose(); expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('application cache declared by a view survives disposal and a fresh instance of that view', async () => {
    const { load, runtime, environment, validate } = setup('application'); const lease = load(); await lease.promise; lease.release(); runtime.dispose();
    const next = new ViewRuntime(definition('application'), environment); runtimes.push(next);
    const again = next.schemaFragments.acquire('content', 'one', validate); await again.promise;
    expect(again.id).toBe(lease.id); expect(environment.transport).toHaveBeenCalledTimes(1);
  });
  it('resolves path, query and POST body with the shared ExpressionResolver and URI encoding', async () => {
    const { runtime, environment, load, transport } = setup();
    const source = runtime.definition.schemaSources!.content;
    if (typeof source.request === 'string') throw new Error('Expected request object');
    source.request.method = 'POST'; source.request.body = { id: '$state.selected' };
    await runtime.actionEngine.execute('select', { event: { value: 'space / ?' } });
    const lease = load('space / ?'); await lease.promise;
    expect(vi.mocked(transport).mock.calls[0][0]).toMatchObject({ method: 'POST', path: '/api/ui/space%20%2F%20%3F', body: { id: 'space / ?' } });
    const state = environment.store.getState();
    expect(() => environment.resolver.resolvePath('/api/$state.selected/$appState.missing', { state })).toThrow('Unresolved');
  });
  it('records missing path expressions as safe errors without issuing HTTP', async () => {
    const { runtime, load, environment, transport } = setup(); const request = runtime.definition.schemaSources!.content.request; if (typeof request === 'string') throw new Error('Expected request object'); request.path = '/api/$state.missing';
    const lease = load(); await lease.promise; expect(transport).not.toHaveBeenCalled();
    expect(environment.store.getState().schemaFragments[lease.id].error).toContain('Unresolved');
  });
  it('isolates transport and validation errors and supports explicit reload', async () => {
    const transport = vi.fn<ApiTransport>().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(fragment);
    const { load, environment, runtime, validate } = setup('view', transport); const lease = load(); await lease.promise;
    expect(environment.store.getState().schemaFragments[lease.id]).toMatchObject({ status: 'error', error: 'Offline' });
    const retry = runtime.schemaFragments.reload('content', 'one', validate); await retry.promise;
    expect(environment.store.getState().schemaFragments[lease.id].status).toBe('success');
  });
  it('aborts an obsolete key and rejects late success even if transport ignores abort', async () => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => pending.promise).mockResolvedValueOnce({ ...fragment, props: { value: 'New content' } });
    const { load, environment } = setup('view', transport); const old = load('one'); await tick(); old.release(); await tick();
    const current = load('two'); await current.promise; pending.resolve(fragment); await old.promise;
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    expect(environment.store.getState().schemaFragments[old.id]).toBeUndefined();
    expect(environment.store.getState().schemaFragments[current.id].schema).toMatchObject({ props: { value: 'New content' } });
  });
  it('rejects unregistered components, unknown actions, inline handlers and internal namespace bindings', async () => {
    for (const bad of [{ ...fragment, type: 'unknown' }, { ...fragment, handlers: { onClick: { action: 'missing' } } }, { ...fragment, handlers: { onClick: { action: 'select', type: 'state.set' } } }, { ...fragment, bindings: { value: '$schemaFragments.secret' } }]) {
      const { load, environment } = setup('none', async () => bad); const lease = load(); await lease.promise;
      expect(environment.store.getState().schemaFragments[lease.id].status).toBe('error');
    }
  });
  it('validates source references, scope policies and enabled/key contracts before mounting', () => {
    const view = definition(); expect(() => validateViewDefinition(view, registry)).not.toThrow();
    view.root.source = 'missing'; expect(() => validateViewDefinition(view, registry)).toThrow('Unknown schema source');
    view.root.source = 'content'; view.root.key = {}; expect(() => validateViewDefinition(view, registry)).toThrow('key must be scalar');
  });
  it('supports all four public namespaces in path templates and no public fragment namespace', () => {
    const { environment } = setup(); const state = { ...environment.store.getState(), appState: { id: 'a' }, appData: { x: { status: 'success' as const, loading: false, data: { id: 'b' }, error: null } }, viewState: { id: 'c' }, viewData: { x: { status: 'success' as const, loading: false, data: { id: 'd' }, error: null } } };
    expect(environment.resolver.resolvePath('/api/$appState.id/$appData.x.data.id/$state.id/$data.x.data.id', { state })).toBe('/api/a/b/c/d');
    expect(() => environment.resolver.resolve('$schemaFragments', { state })).toThrow('Unknown');
    expect(() => environment.resolver.resolvePath('/api/$state.constructor', { state })).toThrow('Unsafe');
  });
  it('captures request expressions with the activated key before later state changes', async () => {
    const { load, runtime, transport } = setup(); const lease = load('one');
    await runtime.actionEngine.execute('select', { event: { value: 'two' } }); await lease.promise;
    expect(vi.mocked(transport).mock.calls[0][0].path).toBe('/api/ui/one');
  });

});

