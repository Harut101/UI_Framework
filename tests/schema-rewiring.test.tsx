import {chooseOption,dropdown} from './fluent-helpers';
// @vitest-environment jsdom
import './fluent-setup';
import { act, useContext, type ComponentProps } from 'react';
import type {Root} from 'react-dom/client';
import {createFluentRoot as createRoot} from './fluent-root';
import { useStore } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { transferableAbortController } from 'node:util';
import type { Server } from 'node:http';
import { app } from '../backend/app';
import { reportingApplicationDefinition } from '../src/schemas/reporting';
import { FullApplicationTab } from '../src/playground/application-tab/FullApplicationTab';
import { demoCatalogs, schemaComparisonSections } from '../src/playground/application-tab/demoCatalogs';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { GenericNavigation } from '../src/components/navigation/GenericNavigation';
import { ApplicationShell } from '../src/components/application/ApplicationShell';
import { UserCard } from '../src/components/users/UserCard';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { RuntimeContext } from '../src/runtime/rendering/RuntimeNode';
import type { RuntimeStore } from '../src/runtime/redux/createRuntimeStore';
import type { ScopeRuntime } from '../src/runtime/shared/ScopeRuntime';
import { DataSourceManager } from '../src/runtime/datasource/DataSourceManager';
import { ActionEngine } from '../src/runtime/actions/ActionEngine';
import { validateApplicationDefinition } from '../src/runtime/shared/validation';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const nativeFetch = fetch;
let server: Server; let base: string; let root: Root; let container: HTMLDivElement;
let store: RuntimeStore; let application: ScopeRuntime;
let viewRuntimes: ScopeRuntime[];
let requests: { url: URL; signal?: AbortSignal; completed?: boolean }[];
let holdReports = false;
const held: { release: () => void }[] = [];
const Navigation = vi.fn((props: ComponentProps<typeof GenericNavigation>) => {
  const runtime = useContext(RuntimeContext)!.runtime;
  if (!viewRuntimes.includes(runtime)) viewRuntimes.push(runtime);
  return <GenericNavigation {...props}/>;
});
function Shell(props: ComponentProps<typeof ApplicationShell>) {
  store = useStore() as RuntimeStore;
  application = useContext(RuntimeContext)!.runtime;
  return <ApplicationShell {...props}/>;
}
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry()))
  .register('application-shell', Shell).register('generic-navigation', Navigation);
async function until(predicate: () => boolean) {
  await act(async () => {
    const deadline = Date.now() + 5000;
    while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 15));
    expect(predicate(), store ? JSON.stringify(store.getState()) : 'No application store').toBe(true);
  });
}
beforeAll(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing server address');
  base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
beforeEach(async () => {
  requests = []; viewRuntimes = []; holdReports = false; Navigation.mockClear();
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const record = { url, signal: init?.signal ?? undefined, completed: false }; requests.push(record);
    const ignoreAbort = holdReports && url.pathname === '/api/reports';
    // The hold deliberately ignores abort to verify stale results cannot cross view scopes.
    if (ignoreAbort) await new Promise<void>(release => held.push({ release }));
    const controller = transferableAbortController();
    const abort = () => controller.abort();
    if (!ignoreAbort) init?.signal?.addEventListener('abort', abort, { once: true });
    if (!ignoreAbort && init?.signal?.aborted) abort();
    try {
      const response = await nativeFetch(base + url.pathname + url.search, { ...init, signal: controller.signal });
      if (ignoreAbort) { await response.clone().arrayBuffer(); record.completed = true; }
      return response;
    }
    finally { init?.signal?.removeEventListener('abort', abort); }
  });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(<MemoryRouter initialEntries={['/application/catalog']}><Routes><Route path="/application/*" element={<FullApplicationTab registry={registry}/>}/></Routes></MemoryRouter>));
  await until(() => store?.getState().viewData.reports?.status === 'success' && store.getState().viewData.facets?.status === 'success' && store.getState().appData.me?.status === 'success' && store.getState().appData.navigation?.status === 'success');
});
afterEach(async () => {
  holdReports = false; held.splice(0).forEach(item => item.release());
  await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals();
});
async function choose(id:string){await chooseOption(container,'Demo Schema',id==='users'?'Users Catalog':'Reports Catalog');}
async function click(element: Element | undefined | null) { expect(element).toBeTruthy(); await act(async () => (element as HTMLElement).click()); }
const calls = (path: string) => requests.filter(request => request.url.pathname === path);

describe('same runtime and navigation, different JSON relationships', () => {
  it('inspects live scopes, registry, dependencies, resolved actions, and lifecycle events without changing execution', async () => {
    const before = store.getState(); const appRuntime = application; const initialCalls = requests.length;
    await click(container.querySelector('button[aria-controls="full-runtime-inspector"]'));
    const inspector = container.querySelector('.developer-runtime-inspector')!;
    expect(inspector.textContent).toContain('PLAYGROUND TOOLING');
    expect([...inspector.querySelectorAll('.inspector-identity dd')].map(value => value.textContent)).toEqual(['guardian-reporting', 'reporting.catalog']);
    for (const namespace of ['$appState', '$appData', '$state', '$data']) expect(inspector.querySelector('.schema-runtime-inspector')?.textContent).toContain(namespace);
    expect([...inspector.querySelectorAll('.inspector-components code')].map(value => value.textContent)).toEqual(registry.list());
    expect(inspector.querySelector('.inspector-dependencies')?.textContent).toContain('$state.filters.module');
    await click(inspector.querySelector('.inspector-definition button'));
    expect(inspector.querySelector('.inspector-definition pre')?.textContent).toContain('onAppInit');
    expect(requests).toHaveLength(initialCalls); expect(store.getState()).toBe(before); expect(application).toBe(appRuntime);
    await click([...container.querySelectorAll('nav[aria-label="By module"] button')].find(button => button.textContent?.startsWith('Active Directory')));
    await until(() => calls('/api/reports').length === 2 && store.getState().viewData.reports.status === 'success');
    const action = [...inspector.querySelectorAll('[aria-label="Action log"] article')].find(entry => entry.querySelector('strong')?.textContent === 'selectModule')!;
    expect(action.textContent).toContain('state.set'); expect(action.textContent).toContain('filters.module'); expect(action.querySelector('pre')?.textContent).toBe('"active-directory"');
    const lifecycle = [...inspector.querySelectorAll('[aria-label="Datasource lifecycle log"] article')].filter(entry => entry.querySelector('strong')?.textContent === 'reports').map(entry => entry.querySelector('code')?.textContent);
    expect(lifecycle.slice(-4)).toEqual(['dependencyChanged', 'debounced', 'loading', 'success']);
    const reportStatus = [...inspector.querySelectorAll('.inspector-statuses article')].find(entry => entry.querySelector('strong')?.textContent === 'reports')!;
    expect([...reportStatus.querySelectorAll('dd')].map(value => value.textContent)).toEqual(['success', 'false', 'null']);
    const stateBeforeClear = store.getState(); const requestsBeforeClear = requests.length;
    await click(inspector.querySelector('header button'));
    expect(application.environment.diagnostics.snapshot()).toEqual([]);
    expect(store.getState()).toBe(stateBeforeClear); expect(requests).toHaveLength(requestsBeforeClear);
    expect(inspector.textContent).toContain('No actions recorded yet.');
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    expect([...inspector.querySelectorAll('.inspector-identity dd')].map(value => value.textContent)).toEqual(['guardian-reporting', 'users.catalog']);
    expect(inspector.querySelector('.inspector-dependencies')?.textContent).toContain('$state.filters.department');
    expect(inspector.querySelector('.inspector-dependencies')?.textContent).not.toContain('$state.filters.module');
    expect([...inspector.querySelectorAll('.inspector-definition .fui-AccordionHeader code')].map(value => value.textContent)).toEqual(['navigation', 'me', 'users']);
    await click(container.querySelector('button[aria-controls="full-runtime-inspector"]'));
    expect(container.querySelector('.developer-runtime-inspector')).toBeNull(); expect(application).toBe(appRuntime);
  });
  it('explains the independent reaction paths in an accessible tooling modal without changing runtime state', async () => {
    const before = store.getState(); const initialCalls = requests.length;
    const trigger = [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Architecture')!;
    trigger.focus(); await click(trigger);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true'); expect(dialog.textContent).toContain('PLAYGROUND TOOLING');
    expect(dialog.querySelector('[aria-label="UI reaction flow"]')?.textContent).toContain('Generated handler callback');
    expect(dialog.querySelector('[aria-label="Datasource side effect flow"]')?.textContent).toContain('listenerMiddleware');
    expect(dialog.querySelector('[aria-label="Datasource side effect flow"]')?.textContent).toContain('DependencyGraph');
    expect([...dialog.querySelectorAll('.architecture-contracts dt')].map(value => value.textContent)).toEqual(['bindings', 'visibility', 'handlers', 'dependsOn']);
    expect(dialog.querySelector('button[aria-label="Close architecture"]')).not.toBeNull();
    
    expect(store.getState()).toBe(before); expect(requests).toHaveLength(initialCalls);
    await act(async () => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
  });
  it('keeps the demo selector outside the schema-generated application and compares the real definitions', async () => {
    await click(container.querySelector('.schema-comparison button'));
    expect(dropdown(container,'Demo Schema').closest('.application-shell')).toBeNull();
    expect(dropdown(container,'Demo Schema').textContent).toBe('Reports Catalog');
    expect(registry.get('user-card')).toBe(UserCard);
    for (const catalog of demoCatalogs) {
      expect(() => validateApplicationDefinition(reportingApplicationDefinition, registry)).not.toThrow();
      const sections = schemaComparisonSections(catalog.definition, catalog.navigationId, catalog.listId);
      const comparison = container.querySelector(`section[aria-label="${catalog.label} schema comparison"]`)!;
      expect([...comparison.querySelectorAll('pre')].map(pre => pre.textContent)).toEqual(sections.map(section => JSON.stringify(section.value, null, 2)));
    }
    expect(container.querySelector('.schema-comparison-columns')?.textContent).toContain('selectModule');
    expect(container.querySelector('.schema-comparison-columns')?.textContent).toContain('selectDepartment');
  });
  it('rewires the identical navigation implementation from reports to users while preserving the application/session', async () => {
    const initialApplication = application; const initialStore = store; const environment = application.environment;
    const shell = container.querySelector('.application-header'); const appData = store.getState().appData;
    await click([...container.querySelectorAll('nav[aria-label="By module"] button')].find(button => button.textContent?.startsWith('Active Directory')));
    await until(() => calls('/api/reports').length === 2 && store.getState().viewData.reports?.status === 'success');
    expect(calls('/api/reports')[1].url.searchParams.get('module')).toBe('active-directory');
    expect(store.getState().viewState.filters).toMatchObject({ module: 'active-directory' });
    const firstView = store.getState().viewInstance;
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    expect(store).toBe(initialStore); expect(application).toBe(initialApplication);
    expect(application.environment).toBe(environment); expect(store.getState().appData).toBe(appData);
    expect(container.querySelector('.application-header')).toBe(shell);
    expect(store.getState().viewInstance).not.toBe(firstView);
    expect(store.getState().viewData.reports).toBeUndefined();
    expect(container.querySelectorAll('.user-card-grid .ui-user-card')).toHaveLength(12);
    await click([...container.querySelectorAll('nav[aria-label="By department"] button')].find(button => button.textContent?.startsWith('Engineering')));
    await until(() => calls('/api/users').length === 2 && store.getState().viewData.users.status === 'success');
    expect(store.getState().viewState.filters).toMatchObject({ department: 'engineering' });
    expect(calls('/api/users')[1].url.searchParams.get('department')).toBe('engineering');
    expect(container.querySelectorAll('.user-card-grid .ui-user-card')).toHaveLength(4);
    expect(registry.get('generic-navigation')).toBe(Navigation);
    expect(viewRuntimes.map(runtime => runtime.definition.id)).toContain('reporting.catalog');
    expect(viewRuntimes.map(runtime => runtime.definition.id)).toContain('users.catalog');
    for (const runtime of viewRuntimes) {
      expect(runtime.environment).toBe(environment); expect(runtime.dataSources).toBeInstanceOf(DataSourceManager); expect(runtime.actionEngine).toBeInstanceOf(ActionEngine);
    }
    expect(calls('/api/app/navigation')).toHaveLength(1); expect(calls('/api/me')).toHaveLength(1);
  });
  it('wires Disabled users to a status patch and shows profiles through existing shared layouts', async () => {
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    await click([...container.querySelectorAll('nav[aria-label="By account status"] button')].find(button => button.textContent?.startsWith('Disabled users')));
    await until(() => calls('/api/users').length === 2 && store.getState().viewData.users.status === 'success');
    expect(calls('/api/users')[1].url.searchParams.get('status')).toBe('disabled');
    expect(container.querySelectorAll('.user-card-grid .ui-user-card')).toHaveLength(3);
    await click(container.querySelector('.user-card-grid [role="article"] button'));
    expect(store.getState().viewState.selectedUser).toMatchObject({ name: 'Mia Chen' });
    expect(document.querySelector('[role="dialog"][aria-label="User profile"]')?.textContent).toContain('mia.chen@example.com');
    await click(document.querySelector('button[aria-label="Close user profile"]'));
    expect(document.querySelector('[role="dialog"][aria-label="User profile"]')).toBeNull();
  });
  it('clears view state on round trips but preserves app state and registry', async () => {
    await click(container.querySelector('.application-brand button'));
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    await click([...container.querySelectorAll('nav[aria-label="By department"] button')].find(button => button.textContent?.startsWith('Finance')));
    await until(() => calls('/api/users').length === 2 && store.getState().viewData.users.status === 'success');
    await choose('reports'); await until(() => store.getState().viewData.reports?.status === 'success');
    expect(store.getState().viewState.filters).toMatchObject({ module: '' });
    expect(store.getState().viewState.filters).not.toHaveProperty('department');
    expect(store.getState().appState.navigationCollapsed).toBe(true);
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    expect(store.getState().viewState.filters).toEqual({ department: '', status: '', search: '' });
    expect(store.getState().appState.navigationCollapsed).toBe(true);
    expect(calls('/api/app/navigation')).toHaveLength(1);
  });
  it('cancels in-flight work when switching and rejects a late old-view completion', async () => {
    holdReports = true;
    await click([...container.querySelectorAll('nav[aria-label="By module"] button')].find(button => button.textContent?.startsWith('Active Directory')));
    await until(() => held.length === 1);
    const pending = calls('/api/reports').at(-1)!;
    await choose('users'); await until(() => store.getState().viewData.users?.status === 'success');
    expect(pending.signal?.aborted).toBe(true);
    held.splice(0).forEach(item => item.release());
    await until(() => pending.completed === true);
    expect(store.getState().viewData.reports).toBeUndefined();
    expect(store.getState().viewData.users.status).toBe('success');
    expect(container.querySelectorAll('.user-card-grid .ui-user-card')).toHaveLength(12);
  });
});
