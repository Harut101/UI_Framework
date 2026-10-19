import { inlineSourceId } from '../src/runtime/datasource/inlineRequest';
import {chooseOption,dropdown} from './fluent-helpers';
// @vitest-environment jsdom
import './fluent-setup';
import { act } from 'react';
import type {Root} from 'react-dom/client';
import {createFluentRoot as createRoot} from './fluent-root';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { transferableAbortController } from 'node:util';
import { app } from '../backend/app';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { ApplicationHost } from '../src/runtime/application/ApplicationHost';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { resolveRequestPath, type ApiTransport } from '../src/runtime/datasource/api';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { reportingApplicationDefinition } from '../src/schemas/reporting';
import { validateApplicationDefinition } from '../src/runtime/shared/validation';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let server: Server; let base: string; let root: Root; let container: HTMLDivElement;
let environment: RuntimeEnvironment; let runtime: ApplicationRuntime;
let failNextReports = false;
const transport = vi.fn<ApiTransport>(async (request, signal) => {
  if (failNextReports && request.path === '/api/reports') { failNextReports = false; throw new Error('Reports temporarily unavailable'); }
  const url = new URL(resolveRequestPath(request), base);
  for (const [key, value] of Object.entries(request.query ?? {})) if (value !== '' && value !== null && value !== undefined) url.searchParams.set(key, String(value));
  // Bridge jsdom's AbortSignal into the Node HTTP transport's native realm.
  const controller = transferableAbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    const response = await fetch(url, { method: request.method, signal: controller.signal });
    if (!response.ok) throw new Error((await response.json()).message);
    return await response.json();
  } finally { signal.removeEventListener('abort', abort); }
});
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry()));
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing server address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
async function until(predicate: () => boolean) {
  await act(async () => {
    const deadline = Date.now() + 5000;
    while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 15));
    expect(predicate(), JSON.stringify(environment.store.getState())).toBe(true);
  });
}
beforeEach(async () => {
  transport.mockClear(); failNextReports = false;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  runtime = new ApplicationRuntime(reportingApplicationDefinition, environment); runtime.start();
  await act(async () => root.render(<Provider store={environment.store}><MemoryRouter initialEntries={['/application/catalog']}><ApplicationHost definition={reportingApplicationDefinition} environment={environment} runtime={runtime} registry={registry}/></MemoryRouter></Provider>));
  await until(() => environment.store.getState().viewData.reports?.status === 'success' && environment.store.getState().appData.navigation?.status === 'success' && environment.store.getState().viewData.facets?.status === 'success' && environment.store.getState().appData.me?.status === 'success');
});
afterEach(async () => { await act(async () => root.unmount()); runtime.dispose(); container.remove(); });
const reportRequests = () => transport.mock.calls.filter(([request]) => request.path === '/api/reports');
const reportsLoaded = () => environment.store.getState().viewData.reports.status === 'success';
async function click(element: Element | null) { expect(element).not.toBeNull(); await act(async () => (element as HTMLElement).click()); }

describe('schema-generated Reports Catalog with real backend APIs', () => {
  it('validates and renders the entire application shell and view from JSON', () => {
    expect(() => validateApplicationDefinition(reportingApplicationDefinition, registry)).not.toThrow();
    expect(reportingApplicationDefinition.shell.children?.map(node => node.type)).toEqual(['application-header', 'data-tree', 'route-outlet']);
    expect(container.querySelector('.application-shell > .application-header')?.textContent).toContain('Cayosoft');
    expect(container.querySelector('.application-header')?.textContent).toContain('Alex Morgan');
    expect(container.querySelector('.application-navigation button[aria-current=page]')?.textContent).toBe('Catalog workspace');
    expect(container.querySelector('.report-catalog h2')?.textContent).toBe('Browse all reports');
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(24);
    expect(container.querySelector('.report-catalog')?.textContent).toContain('24 report definitions');
  });
  it('loads Guardian navigation parents from the backend and merges remote child DATA through the same runtime', async () => {
    const nav = container.querySelector('.application-navigation')!;
    const navButton = (name: string) => [...nav.querySelectorAll('button')].find(button => button.textContent === name)!;
    expect(JSON.stringify(reportingApplicationDefinition)).not.toMatch(/Forest Recovery|forestRecovery|childLinksSourceUrl/);
    expect(transport.mock.calls.filter(([request]) => request.path.startsWith('/api/v0/'))).toHaveLength(0);
    const loaded = (path: string) => environment.store.getState().appData[inlineSourceId({ path, method: 'GET' })]?.status === 'success';
    await click(navButton('Microsoft 365')); await until(() => loaded('/api/v0/msGraph/tenants'));
    expect(nav.textContent).toContain('Contoso · Production');
    await click(navButton('Active Directory')); await until(() => loaded('/api/v0/msAd/domains'));
    expect(nav.textContent).toContain('corp.contoso.com');
    await click(navButton('Forest Recovery')); expect(nav.textContent).toContain('Recovery Jobs');
    await until(() => loaded('/api/v0/recovery/effectiveNavigationProperties'));
    const children = navButton('Forest Recovery').parentElement!.querySelector('.application-nav-children')!;
    expect([...children.querySelectorAll('button')].map(button => button.textContent)).toEqual(['Recovery overview', 'Recovery Jobs', 'Recovered Objects', 'Recovery Plans']);
    await click(navButton('Recovery Jobs')); expect(environment.store.getState().appState.selectedNavigationId).toBe('jobs');
    expect(environment.navigate).toHaveBeenCalledWith('/application/recovery/jobs');
    await click(navButton('Forest Recovery')); await click(navButton('Forest Recovery'));
    expect(transport.mock.calls.filter(([request]) => request.path === '/api/v0/recovery/effectiveNavigationProperties')).toHaveLength(1);
    expect(environment.store.getState().schemaFragments).toEqual({});
  });
  it('uses a facet callback, named action, listener, and datasource to reload the list', async () => {
    const button = [...container.querySelectorAll('nav[aria-label="By module"] button')].find(item => item.textContent?.startsWith('Active Directory'))!;
    await click(button);
    expect(environment.store.getState().viewState.filters).toMatchObject({ module: 'active-directory' });
    await until(() => reportRequests().length === 2 && reportsLoaded());
    expect(reportRequests()[1][0].query?.module).toBe('active-directory');
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(5);
    expect(dropdown(container,'Module').textContent).toBe('Active Directory');
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ kind: 'dependency', label: 'reports dependency changed', detail: '$state.filters.module' }));
  });
  it('changes advanced-filter visibility through Redux without making a datasource request', async () => {
    const appData = environment.store.getState().appData;
    expect(container.querySelector('.catalog-advanced-filters')).toBeNull();
    await click(container.querySelector('input[role=switch]'));
    expect(environment.store.getState().viewState.ui).toMatchObject({ showAdvancedFilters: true });
    expect(container.querySelector('.catalog-advanced-filters')).not.toBeNull();
    expect(reportRequests()).toHaveLength(1);
    expect(environment.store.getState().appData).toBe(appData);
    await click(container.querySelector('input[role=switch]'));
    expect(container.querySelector('.catalog-advanced-filters')).toBeNull();
  });
  it('combines Fluent dropdown filters and clears them with one patch reload', async () => {
    await chooseOption(container,'Module','Active Directory');
    await chooseOption(container,'Compliance framework','SOC 2');
    await chooseOption(container,'Report type','Audit evidence');
    await until(() => reportsLoaded() && reportRequests().at(-1)?.[0].query?.type === 'audit');
    expect(reportRequests().at(-1)?.[0].query).toMatchObject({module:'active-directory',framework:'soc2',type:'audit'});
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(3);
    const beforeClear = reportRequests().length;
    const clear = [...container.querySelectorAll('button')].find(item => item.textContent === 'Clear filters')!;
    await click(clear); await until(() => reportRequests().length === beforeClear + 1 && reportsLoaded());
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(24);
    expect(reportRequests()).toHaveLength(beforeClear + 1);
  });
  it('loads details, runs the selected report, and closes with Escape', async () => {
    const appData = environment.store.getState().appData;
    await click(container.querySelector('.report-list [role="article"] button'));
    await until(() => environment.store.getState().viewData.selectedReport.status === 'success');
    expect(document.querySelector('.report-details-body h2')?.textContent).toBe('Privileged access review');
    expect(transport.mock.calls.find(([request]) => request.path === '/api/reports/{id}')?.[0].params).toEqual({ id: 'privileged-access' });
    expect(document.querySelector('.report-details')?.contains(document.activeElement)).toBe(true);
    await click(document.querySelector('.run-report-button'));
    await until(() => environment.store.getState().viewState.lastRun !== null);
    expect(environment.store.getState().viewState.ui).toMatchObject({ running: false });
    expect(document.querySelector('.report-run-result')?.textContent).toContain('18 rows');
    expect(environment.notify).toHaveBeenCalledWith('Privileged access review completed successfully.', 'success');
    await act(async () => document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('.report-details')).toBeNull();
    expect(environment.store.getState().viewData.selectedReport.status).toBe('idle');
    expect(environment.store.getState().appData).toBe(appData);
  });
  it('keeps the shell mounted during filtering and surfaces retryable datasource errors', async () => {
    const header = container.querySelector('.application-header'); const appData = environment.store.getState().appData;
    failNextReports = true;
    await chooseOption(container,'Module','Active Directory');
    await until(() => environment.store.getState().viewData.reports.status === 'error');
    expect(container.querySelector('.report-list-error')?.textContent).toContain('Reports temporarily unavailable');
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(24);
    await click(container.querySelector('.report-list-error button')); await until(reportsLoaded);
    expect(container.querySelectorAll('.report-list [role="article"]')).toHaveLength(5);
    expect(container.querySelector('.application-header')).toBe(header);
    expect(environment.store.getState().appData).toBe(appData);
  });
  it('binds shell interaction to appState without changing view state or reloading reports', async () => {
    const viewState = environment.store.getState().viewState;
    await click(container.querySelector('.application-brand button'));
    expect(environment.store.getState().appState.navigationCollapsed).toBe(true);
    expect(container.querySelector('.application-shell')?.classList.contains('navigation-collapsed')).toBe(true);
    expect(environment.store.getState().viewState).toBe(viewState);
    expect(reportRequests()).toHaveLength(1);
  });
});


