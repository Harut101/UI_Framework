// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { transferableAbortController } from 'node:util';
import { createFluentRoot } from './fluent-root';
import { app } from '../backend/app';
import { ApplicationHost } from '../src/runtime/application/ApplicationHost';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { reportingApplicationDefinition } from '../src/schemas/reporting';
import { resolveRequestPath, type ApiTransport } from '../src/runtime/datasource/api';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const nativeFetch = fetch;
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry()));
let server: Server, base: string, root: Root, container: HTMLDivElement;
let environment: RuntimeEnvironment, application: ApplicationRuntime, navigate: NavigateFunction, pathname: string;
let failUsers = false;
let requests: { path: string; query?: Record<string, unknown>; signal: AbortSignal }[];
function RouterProbe() { navigate = useNavigate(); pathname = useLocation().pathname; return null; }
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address');
  base = 'http://127.0.0.1:' + address.port;
});
afterAll(async () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
afterEach(async () => { await act(async () => root?.unmount()); application?.dispose(); container?.remove(); });
async function until(check: () => boolean) {
  const deadline = Date.now() + 4000;
  while (!check() && Date.now() < deadline) await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
  expect(check(), container?.textContent?.slice(-800)).toBe(true);
}
async function mount(entries = ['/application/catalog'], strict = false) {
  requests = []; failUsers = false;
  const transport: ApiTransport = async (request, signal) => {
    requests.push({ path: request.path, query: request.query, signal });
    if (failUsers && request.path === '/api/ui/views' && request.query?.path === '/application/users') { failUsers = false; throw new Error('Schema temporarily unavailable'); }
    const url = new URL(resolveRequestPath(request), base);
    for (const [key,value] of Object.entries(request.query ?? {})) if (value != null && value !== '') url.searchParams.set(key, String(value));
    const controller = transferableAbortController(); const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    try {
      const response = await nativeFetch(url, { method: request.method, signal: controller.signal });
      if (!response.ok) throw new Error((await response.json()).message);
      return response.json();
    } finally { signal.removeEventListener('abort', abort); }
  };
  environment = new RuntimeEnvironment(to => navigate(to), vi.fn(), transport);
  application = new ApplicationRuntime(reportingApplicationDefinition, environment); application.start();
  container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container);
  const content = <Provider store={environment.store}><MemoryRouter initialEntries={entries}><RouterProbe/><ApplicationHost definition={reportingApplicationDefinition} environment={environment} runtime={application} registry={registry}/></MemoryRouter></Provider>;
  await act(async () => root.render(strict ? <StrictMode>{content}</StrictMode> : content));
}
const schemas = () => requests.filter(entry => entry.path === '/api/ui/views');
const loaded = (id: string) => environment.viewScope?.definition.id === id;
const button = (text: string) => [...container.querySelectorAll<HTMLButtonElement>('.application-navigation button')].find(node => node.textContent === text)!;
async function click(node: HTMLElement) { expect(node).toBeTruthy(); await act(async () => node.click()); }

describe('navigation URL loads a complete backend ViewDefinition', () => {
  it('clicks backend navigation, preserves the shell/store and replaces the entire View scope', async () => {
    await mount(); await until(() => loaded('reporting.catalog') && environment.store.getState().viewData.reports?.status === 'success');
    const shell = container.querySelector('.application-header'); const store = environment.store;
    const previous = environment.viewScope!; const appId = application.scopeId;
    expect(reportingApplicationDefinition).not.toHaveProperty('routes'); expect(reportingApplicationDefinition).not.toHaveProperty('views');
    await click(button('Users catalog')); await until(() => loaded('users.catalog') && environment.store.getState().viewData.users?.status === 'success');
    expect(pathname).toBe('/application/users'); expect(schemas().map(entry => entry.query?.path)).toEqual(['/application/catalog','/application/users']);
    expect(environment.store).toBe(store); expect(application.scopeId).toBe(appId); expect(container.querySelector('.application-header')).toBe(shell);
    expect(previous.active()).toBe(false); expect(environment.store.getState().viewData.reports).toBeUndefined();
    expect(container.querySelector('.user-card-grid')).toBeTruthy();
    expect(button('Users catalog').getAttribute('aria-current')).toBe('page');
    expect(environment.store.getState().appState.breadcrumbs).toEqual(['Guardian','Users catalog']);
  });
  it('opens remote navigation children as different full View trees without frontend route entries', async () => {
    await mount(); await until(() => loaded('reporting.catalog') && !!button('Microsoft 365'));
    await click(button('Microsoft 365')); await until(() => !!button('Contoso · Production'));
    await click(button('Contoso · Production')); await until(() => loaded('tenant.contoso'));
    expect(pathname).toBe('/application/tenants/contoso'); expect(container.textContent).toContain('Tenant alias');
    expect(environment.store.getState().viewState.tenantAlias).toBe('contoso.onmicrosoft.com');
    await click(button('Active Directory')); await until(() => !!button('corp.contoso.com'));
    await click(button('corp.contoso.com')); await until(() => loaded('directory.corp-domain'));
    expect(container.textContent).toContain('Replication health'); expect(container.querySelector('[role=tablist]')).toBeTruthy();
    expect(schemas().at(-1)?.query?.path).toBe('/application/domains/corp-domain');
  });
  it('supports direct links, Back and Forward with fresh View lifetimes and correct navigation selection', async () => {
    await mount(['/application/catalog','/application/users']); await until(() => loaded('users.catalog'));
    const first = environment.viewScope!.scopeId;
    await act(async () => navigate(-1)); await until(() => loaded('reporting.catalog') && !!button('Catalog workspace'));
    expect(button('Catalog workspace').getAttribute('aria-current')).toBe('page');
    await act(async () => navigate(1)); await until(() => loaded('users.catalog'));
    expect(environment.viewScope!.scopeId).not.toBe(first); expect(schemas()).toHaveLength(3);
    expect(button('Users catalog').getAttribute('aria-current')).toBe('page');
  });
  it('keeps the shell usable on schema failure and retries without falling back to bundled Views', async () => {
    await mount(); await until(() => loaded('reporting.catalog') && !!button('Users catalog'));
    failUsers = true; await click(button('Users catalog'));
    await until(() => container.textContent?.includes('Schema temporarily unavailable') === true);
    expect(environment.store.getState().viewInstance).toBeNull();
    expect(container.querySelector('.application-header')).toBeTruthy();
    await click([...container.querySelectorAll<HTMLButtonElement>('button')].find(node => /^Retry/.test(node.textContent ?? ''))!);
    await until(() => loaded('users.catalog'));
    expect(schemas().filter(entry => entry.query?.path === '/application/users')).toHaveLength(2);
    await act(async () => navigate('/application/missing'));
    await until(() => container.textContent?.includes('View schema not found') === true);
    expect(environment.store.getState().viewInstance).toBeNull();
  });
  it('deduplicates schema acquisition and scope activation in React StrictMode', async () => {
    await mount(['/application/users'], true); await until(() => loaded('users.catalog'));
    expect(schemas()).toHaveLength(1);
    expect(environment.listScopes().filter(scope => scope.type === 'view')).toHaveLength(1);
    expect(environment.diagnostics.snapshot().filter(event => event.metadata?.viewSchema && event.metadata.event === 'success')).toHaveLength(1);
  });
});
