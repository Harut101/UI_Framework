// @vitest-environment jsdom
import './fluent-setup';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import type { Server } from 'node:http';
import { transferableAbortController } from 'node:util';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../backend/app';
import panelView from '../src/schemas/views/playground/dynamic-fragment.json';
import { applicationDefinition } from '../src/schemas';
import { createComponentRegistry } from '../src/components/registry';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntimeHost } from '../src/runtime/view/ViewRuntimeHost';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import { normalizeFragmentDefinition } from '../src/runtime/fragment/normalizeFragmentDefinition';
import { resolveRequestPath, type ApiTransport } from '../src/runtime/datasource/api';
import { createFluentRoot } from './fluent-root';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const registry = createComponentRegistry();
function checkedDefinition() {
  const value: unknown = panelView;
  validateViewDefinition(value, registry);
  return value;
}
const definition = checkedDefinition();
let server: Server, base: string, root: Root | undefined, container: HTMLDivElement;
let environment: RuntimeEnvironment, application: ApplicationRuntime;
let requests: { path: string; query?: Record<string, unknown>; method: string; body?: unknown; signal: AbortSignal }[];
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No address');
  base = 'http://127.0.0.1:' + address.port;
});
afterAll(async () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; application?.dispose(); container?.remove(); });
async function until(check: () => boolean) {
  const deadline = Date.now() + 5000;
  while (!check() && Date.now() < deadline) await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); });
  expect(check(), document.body.textContent?.slice(-1000)).toBe(true);
}
async function mount() {
  requests = [];
  const transport: ApiTransport = async (request, signal) => {
    requests.push({ path: request.path, query: request.query, method: request.method, body: request.body, signal });
    const url = new URL(resolveRequestPath(request), base);
    for (const [key, value] of Object.entries(request.query ?? {})) if (value != null && value !== '') url.searchParams.set(key, String(value));
    const controller = transferableAbortController(); const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
    try {
      const response = await fetch(url, { method: request.method, signal: controller.signal, headers: request.body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: request.body === undefined ? undefined : JSON.stringify(request.body) });
      if (!response.ok) throw new Error((await response.json()).message);
      return response.json();
    } finally { signal.removeEventListener('abort', abort); }
  };
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  application = new ApplicationRuntime(applicationDefinition, environment); application.start();
  container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container);
  await act(async () => root!.render(<Provider store={environment.store}><ViewRuntimeHost definition={definition} environment={environment} registry={registry}/></Provider>));
  await until(() => !!environment.viewScope);
}
const fragments = () => environment.listScopes().filter(scope => scope.type === 'fragment');
const current = () => fragments()[0];
const calls = () => requests.filter(request => ['/api/ui/users/create', '/api/ui/reports/run', '/api/ui/object-panels'].includes(request.path));
const panel = () => document.querySelector<HTMLElement>('[role=dialog][aria-label="Dynamic schema panel"]')!;
const button = (parent: ParentNode, label: string) => [...parent.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent === label)!;
async function click(node: HTMLElement) { expect(node).toBeTruthy(); await act(async () => node.click()); }
async function execute(action: string) { await act(async () => environment.viewScope!.actionEngine.execute(action, { scope: environment.viewScope! })); }

describe('actions select panel schemas independently of object identity', () => {
  it('serves validated self-contained fragments and rejects invalid schema/context parameters', async () => {
    for (const schema of ['microsoft-365', 'active-directory', 'configuration', 'user.create', 'report.run']) {
      const response = await fetch(base + '/api/ui/panels?schema=' + schema + (schema === 'report.run' ? '&contextId=privileged-access' : ''));
      expect(response.status).toBe(200);
      const fragment = normalizeFragmentDefinition(await response.json(), registry);
      expect(fragment.type).toBe('fragment'); expect(fragment.root).toBeTruthy();
      if (schema === 'user.create') expect(fragment.state).toMatchObject({ contextId: null, displayName: '' });
      if (schema === 'report.run') expect(fragment.state.contextId).toBe('privileged-access');
    }
    for (const [query, status] of [['',400], ['schema=user.create&schema=report.run',400], ['schema=missing',404], ['schema=toString',404], ['schema=report.run',404], ['schema=report.run&contextId=missing',404]] as const)
      expect((await fetch(base + '/api/ui/panels?' + query)).status).toBe(status);
    for (const [path, id] of [
      ['/api/ui/users/create', 'user.create'],
      ['/api/ui/reports/run?contextId=gpo-changes', 'report.run'],
      ['/api/ui/object-panels?schema=microsoft-365', 'panel.microsoft-365'],
    ]) {
      const response = await fetch(base + path); expect(response.status).toBe(200);
      expect(normalizeFragmentDefinition(await response.json(), registry).id).toBe(id);
    }
    // Per-request context is cloned; it cannot contaminate the cached author template.
    const value = await (await fetch(base + '/api/ui/panels?schema=user.create')).json();
    expect(value.state.contextId).toBeNull();
  }, 10000);

  it('opens without object selection and switches an already-open panel using named actions', async () => {
    await mount(); expect(calls()).toHaveLength(0);
    await click(button(container, 'New user')); await until(() => current()?.definition.id === 'user.create');
    expect(environment.store.getState().viewState.panel).toEqual({ open: true, schemaId: 'user.create', request: { path: '/api/ui/users/create', query: {}, method: 'GET' } });
    expect(environment.store.getState().viewState).not.toHaveProperty('selectedObjectId');
    const first = current(); const store = environment.store;
    const field = panel().querySelector<HTMLInputElement>('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, 'Alex Morgan');
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(environment.store.getState().fragments[first.scopeId].state.displayName).toBe('Alex Morgan');
    expect(environment.store.getState().viewState).not.toHaveProperty('displayName');

    await click(button(panel(), 'Run report panel')); await until(() => current()?.definition.id === 'report.run');
    expect(environment.store).toBe(store); expect(first.active()).toBe(false);
    expect(environment.store.getState().fragments[first.scopeId]).toBeUndefined();
    expect(panel().textContent).toContain('privileged-access'); expect(panel().textContent).not.toContain('Email address');
    await click(button(panel(), 'Start report run'));
    await until(() => !!environment.store.getState().fragments[current().scopeId].state.lastRun);
    expect(requests.at(-1)?.path).toBe('/api/reports/{id}/run');

    await click(button(panel(), 'New user')); await until(() => current()?.definition.id === 'user.create');
    expect(calls().map(request => request.path)).toEqual(['/api/ui/users/create', '/api/ui/reports/run']);
    expect(calls()).toHaveLength(2); // Cached definition; a fresh independent scope.
    expect(current().scopeId).not.toBe(first.scopeId);
    expect(environment.store.getState().fragments[current().scopeId].state.displayName).toBe('');
    await click(panel().querySelector<HTMLButtonElement>('[aria-label="Close dynamic schema panel"]')!);
    await until(() => fragments().length === 0);
    expect(environment.store.getState().viewState.panel).toMatchObject({ open: false });
  });

  it('includes resolved context in identity even when schema key stays the same, and cancels pending replacements', async () => {
    await mount();
    await execute('openReportRunPanel'); await until(() => current()?.definition.id === 'report.run');
    const first = current();
    await click(button(panel(), 'Run changes report'));
    await until(() => current()?.scopeId !== first.scopeId && current()?.definition.id === 'report.run');
    expect(first.active()).toBe(false); expect(calls().at(-1)?.method).toBe('POST'); expect(calls().at(-1)?.body).toEqual({ contextId: 'gpo-changes' });
    expect(environment.store.getState().fragments[current().scopeId].state.contextId).toBe('gpo-changes');

    await execute('openUserCreatePanel'); await until(() => calls().length === 3);
    const pending = calls().at(-1)!;
    await execute('openReportRunPanel'); await until(() => current()?.definition.id === 'report.run');
    expect(pending.signal.aborted).toBe(true);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 950)); });
    expect(fragments()).toHaveLength(1); expect(current().definition.id).toBe('report.run');
    expect(environment.store.getState().fragments[current().scopeId].state.contextId).toBe('privileged-access');
  });

  it('keeps Microsoft 365 and Active Directory trees different with fragment-local state', async () => {
    await mount();
    await act(async () => environment.viewScope!.actionEngine.execute('openSelectedPanel', { event: { value: 'microsoft-365' } }));
    await until(() => current()?.definition.id === 'panel.microsoft-365');
    expect(panel().textContent).toContain('Tenant alias');
    expect(environment.store.getState().viewState).not.toHaveProperty('tenantAlias');
    const first = current();
    await act(async () => environment.viewScope!.actionEngine.execute('openSelectedPanel', { event: { value: 'active-directory' } }));
    await until(() => current()?.definition.id === 'panel.active-directory');
    expect(first.active()).toBe(false); expect(panel().querySelector('[role=tablist]')).toBeTruthy();
    expect(panel().textContent).toContain('Replication health'); expect(panel().textContent).not.toContain('Tenant alias');
  });
});
