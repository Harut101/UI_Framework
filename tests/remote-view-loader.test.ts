import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewSchemaLoader } from '../src/runtime/routing/ViewSchemaLoader';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { createComponentRegistry } from '../src/components/registry';
import { validateApplicationDefinition } from '../src/runtime/shared/validation';
import type { ApplicationDefinition } from '../src/runtime/application/types';
import type { ViewDefinition } from '../src/runtime/view/types';
import type { ApiTransport } from '../src/runtime/datasource/api';

const registry = createComponentRegistry();
const source = { request: { path: '/api/view-schema' }, pathQueryParam: 'url' };
const view = (id = 'remote'): ViewDefinition => ({ id, title: id, initialState: { query: '' },
  actions: {}, dataSources: {}, root: { id: 'root', type: 'page' } });
const definition = (): ApplicationDefinition => ({ id: 'app', initialState: {}, dataSources: {}, actions: {},
  shell: { id: 'outlet', type: 'route-outlet' }, routes: [], views: {}, viewSource: source });
const apps: ApplicationRuntime[] = [];
afterEach(() => apps.splice(0).forEach(scope => scope.dispose()));
function setup(transport: ApiTransport = vi.fn(async () => view())) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const scope = new ApplicationRuntime(definition(), environment); apps.push(scope);
  return { scope, environment, loader: new ViewSchemaLoader({}), transport };
}
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>(done => { resolve = done; });
  return { promise, resolve };
}

describe('remote ViewSchemaLoader', () => {
  it('maps the browser pathname into the configured API query and validates the full View', async () => {
    const transport = vi.fn<ApiTransport>(async () => view());
    const { loader, scope } = setup(transport);
    const lease = loader.acquire('/workspace/objects/42', source, scope, registry);
    expect(await lease.promise).toEqual(view());
    expect(transport).toHaveBeenCalledWith({ method: 'GET', path: '/api/view-schema', query: { url: '/workspace/objects/42' } }, expect.any(AbortSignal));
    expect(scope.environment.viewScope).toBeNull();
    lease.release();
  });
  it('deduplicates concurrent leases and StrictMode release/reacquire without sharing View scopes', async () => {
    const transport = vi.fn<ApiTransport>(async () => view());
    const { loader, scope } = setup(transport);
    const first = loader.acquire('/screen', source, scope, registry);
    first.release(); first.release();
    const second = loader.acquire('/screen', source, scope, registry);
    const third = loader.acquire('/screen', source, scope, registry);
    expect(first.promise).toBe(second.promise); expect(second.promise).toBe(third.promise);
    await second.promise;
    expect(transport).toHaveBeenCalledTimes(1);
    expect(scope.environment.viewScope).toBeNull();
    second.release(); await Promise.resolve();
    expect(transport.mock.calls[0][1].aborted).toBe(false);
    third.release(); await Promise.resolve();
    const fourth = loader.acquire('/screen', source, scope, registry);
    await fourth.promise; expect(transport).toHaveBeenCalledTimes(2); fourth.release();
  });
  it('cancels last-consumer work and rejects stale results even when transport ignores AbortSignal', async () => {
    const late = deferred();
    const transport = vi.fn<ApiTransport>(() => late.promise);
    const { loader, scope, environment } = setup(transport);
    const lease = loader.acquire('/slow', source, scope, registry);
    const rejected = expect(lease.promise).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve(); lease.release(); await Promise.resolve();
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    await rejected; late.resolve(view('stale')); await Promise.resolve(); await Promise.resolve();
    expect(environment.viewScope).toBeNull();
    expect(environment.diagnostics.snapshot().some(event => event.metadata?.viewSchema && event.metadata.event === 'success')).toBe(false);
  });
  it('application disposal aborts without waiting for an uncooperative transport', async () => {
    const pending = deferred();
    const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { loader, scope } = setup(transport);
    const lease = loader.acquire('/slow', source, scope, registry);
    const rejected = expect(lease.promise).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve(); scope.dispose(); await rejected;
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    pending.resolve(view()); lease.release();
  });
  it('retry generation starts a fresh request after failure', async () => {
    const transport = vi.fn<ApiTransport>().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(view());
    const { loader, scope } = setup(transport);
    const first = loader.acquire('/retry', source, scope, registry);
    await expect(first.promise).rejects.toThrow('Offline'); first.release();
    const retry = loader.acquire('/retry', source, scope, registry, 1);
    await expect(retry.promise).resolves.toMatchObject({ id: 'remote' });
    expect(transport).toHaveBeenCalledTimes(2); retry.release();
  });
  it.each([
    { root: { id: 'x', type: 'page' } },
    { ...view(), root: { id: 'root', type: 'missing-component' } },
    { ...view(), root: { id: 'root', type: 'route-outlet' } },
    { ...view(), root: { id: 'root', type: 'button', handlers: { onClick: { action: 'missing' } } } },
    { ...view(), initialState: { huge: 'x'.repeat(1024 * 1024) } },
  ])('rejects invalid remote responses before a View scope exists', async response => {
    const { loader, scope } = setup(async () => response);
    const lease = loader.acquire('/invalid', source, scope, registry);
    await expect(lease.promise).rejects.toThrow();
    expect(scope.environment.viewScope).toBeNull(); lease.release();
  });
  it('resolves request expressions only in the owning application scope', async () => {
    const transport = vi.fn<ApiTransport>(async () => view());
    const { loader, scope } = setup(transport);
    const lease = loader.acquire('/screen', { request: { path: '/api/schema', query: { app: '$appState.missing' } } }, scope, registry);
    await lease.promise;
    expect(transport.mock.calls[0][0].query).toEqual({ app: undefined, path: '/screen' }); lease.release();
  });
  it('validates remote source declarations and preserves bundled application contracts', () => {
    expect(() => validateApplicationDefinition(definition(), registry)).not.toThrow();
    for (const viewSource of [
      { ...source, pathQueryParam: '__proto__' }, { ...source, pathQueryParam: '' },
      { request: { path: 'https://example.com/schema' } }, { ...source, cache: 'view' },
      { ...source, onLoaded: 'missing' },
    ]) expect(() => validateApplicationDefinition({ ...definition(), viewSource } as ApplicationDefinition, registry)).toThrow();
    expect(() => validateApplicationDefinition({ ...definition(), routes: [{ path: 'x', viewId: 'x' }], views: { x: view('x') } }, registry)).toThrow('viewSource or bundled');
    const bundled = { ...definition(), viewSource: undefined, routes: [{ path: 'x', viewId: 'x' }], views: { x: view('x') } };
    expect(() => validateApplicationDefinition(bundled, registry)).not.toThrow();
    expect(new ViewSchemaLoader(bundled.views).load('x')).toBe(bundled.views.x);
  });
});
