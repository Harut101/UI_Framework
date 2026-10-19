// @vitest-environment jsdom
import './fluent-setup';
import { act, useContext, type ComponentProps } from 'react';
import type { Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { transferableAbortController } from 'node:util';
import { app } from '../backend/app';
import { createFluentRoot } from './fluent-root';
import { chooseOption } from './fluent-helpers';
import { FullApplicationTab } from '../src/playground/application-tab/FullApplicationTab';
import { ApplicationShell } from '../src/components/application/ApplicationShell';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { registerRouteOutlet } from '../src/runtime/routing/RouteOutlet';
import { RuntimeContext } from '../src/runtime/rendering/RuntimeNode';
import type { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import type { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const nativeFetch = fetch;
let server: Server; let base: string; let root: Root; let container: HTMLDivElement; let environment: RuntimeEnvironment;
let requests: { url: URL; signal?: AbortSignal }[];
function Shell(props: ComponentProps<typeof ApplicationShell>) { environment = useContext(RuntimeContext)!.runtime.environment; return <ApplicationShell {...props}/>; }
const registry = registerRouteOutlet(registerApplicationComponents(createComponentRegistry())).register('application-shell', Shell);
beforeAll(async () => { server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error('No server'); base = `http://127.0.0.1:${address.port}`; });
afterAll(async () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
async function until(predicate: () => boolean) {
  await act(async () => { const deadline = Date.now() + 7000; while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 15)); expect(predicate(), JSON.stringify(environment?.store.getState())).toBe(true); });
}
beforeEach(async () => {
  requests = [];
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input)); const record = { url, signal: init?.signal ?? undefined }; requests.push(record);
    const controller = transferableAbortController(); const abort = () => controller.abort(); record.signal?.addEventListener('abort', abort, { once: true }); if (record.signal?.aborted) abort();
    try { return await nativeFetch(new URL(url.pathname + url.search, base), { ...init, signal: controller.signal }); }
    finally { record.signal?.removeEventListener('abort', abort); }
  });
  container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container);
  await act(async () => root.render(<MemoryRouter initialEntries={['/application/catalog']}><Routes><Route path="/application/*" element={<FullApplicationTab registry={registry}/>}/></Routes></MemoryRouter>));
  await until(() => environment?.store.getState().viewData.reports?.status === 'success');
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const scopes = (id = 'items-panel') => environment.listScopes().filter(scope => scope.type === 'fragment' && scope.definition.id === id);
const state = (scope: RuntimeScope) => environment.store.getState().fragments[scope.scopeId];
const calls = (path: string) => requests.filter(request => request.url.pathname === path);
const pane = () => document.querySelector<HTMLElement>('[role=dialog][aria-label="Dynamic fragment workbench"]')!;
const instances = () => [...pane().querySelectorAll<HTMLElement>('.fragment-demo-instance')];
const button = (target: ParentNode, label: string) => [...target.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === label)!;
async function click(element: HTMLElement | null) { expect(element).toBeTruthy(); await act(async () => element!.click()); }
async function input(element: HTMLInputElement, value: string) { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); }
const toggle = (target: ParentNode, label: string) => [...target.querySelectorAll<HTMLInputElement>('[role=switch]')].find(input => input.closest('.ui-switch')?.textContent === label)!;
async function open() { await click(button(container, 'Open fragment workbench')); await until(() => scopes().length === 2 && scopes().every(scope => state(scope).data.items.status === 'success')); }
async function close() { await click(pane().querySelector<HTMLButtonElement>('[aria-label="Close dynamic fragment workbench"]')); }
const listCount = (instance: ParentNode) => instance.querySelectorAll('.ui-list li').length;

describe('Full Application fragment workbench over real backend HTTP', () => {
  it('opens one cached definition into two initialized independent scopes and proves the complete scoped search flow', async () => {
    expect(scopes()).toHaveLength(0); expect(calls('/api/ui/fragments/items-panel/workspace')).toHaveLength(0);
    await click(button(container, 'Runtime inspector'));
    await open(); const [a, b] = scopes(); const [left, right] = instances();
    expect(container.querySelector('[aria-label="Runtime scope hierarchy"]')?.textContent).toContain(a.scopeId);
    expect(container.querySelector('[aria-label="Runtime scope hierarchy"]')?.textContent).toContain(b.scopeId);
    expect(a.scopeId).not.toBe(b.scopeId); expect(calls('/api/ui/fragments/items-panel/workspace')).toHaveLength(1); expect(calls('/api/items')).toHaveLength(2);
    expect(state(a).state).toEqual({ query: '', selectedId: null, failRequests: false, slowRequests: false, showAdvanced: false }); expect(listCount(left)).toBe(6); expect(listCount(right)).toBe(6);
    const beforeB = state(b); const viewBefore = environment.store.getState().viewState;
    await input(left.querySelector('input[type=search]')!, 'revenue');
    await until(() => state(a).state.query === 'revenue' && state(a).data.items.status === 'success' && calls('/api/items').length === 3);
    expect(listCount(left)).toBe(1); expect(listCount(right)).toBe(6); expect(state(b)).toBe(beforeB); expect(environment.store.getState().viewState).toBe(viewBefore);
    expect(calls('/api/items').at(-1)!.url.searchParams.get('search')).toBe('revenue');
    expect(environment.dependencyGraph.registrations().filter(entry => entry.target.scopeId === a.scopeId)[0].paths).toContainEqual({ scopeId: a.scopeId, area: 'state', path: ['query'] });
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ label: 'items dependency changed', metadata: expect.objectContaining({ instance: a.scopeId, event: 'dependencyChanged' }) }));
    const beforeRequests = calls('/api/items').length; await click(toggle(left, 'Advanced options'));
    expect(left.textContent).toContain('Fragment-local advanced UI'); expect(right.textContent).not.toContain('Fragment-local advanced UI'); expect(calls('/api/items')).toHaveLength(beforeRequests);
  });
  it('isolates failure, retry, recovery and manual reload to the owning fragment', async () => {
    await open(); const [a, b] = scopes(); const [left, right] = instances(); const beforeB = state(b);
    await click(toggle(left, 'Fail requests')); await until(() => state(a).data.items.status === 'error');
    expect(left.textContent).toContain('Simulated API failure'); expect(right.textContent).not.toContain('Simulated API failure'); expect(state(b)).toBe(beforeB);
    const count = calls('/api/items').length; await click(button(left, 'Retry content')); await until(() => calls('/api/items').length === count + 1 && state(a).data.items.status === 'error');
    await click(toggle(left, 'Fail requests')); await until(() => state(a).data.items.status === 'success');
    const reloaded = calls('/api/items').length; await click(button(left, 'Reload items')); await until(() => calls('/api/items').length === reloaded + 1 && state(a).data.items.status === 'success'); expect(state(b)).toBe(beforeB);
  });
  it('loads nested fragments over HTTP, isolates their local edits and replaces them when selection changes', async () => {
    await click(button(container, 'Runtime inspector'));
    await open(); const [a, b] = scopes(); const [left, right] = instances();
    await click(left.querySelector<HTMLButtonElement>('.ui-list li button')); await until(() => scopes('item-note').length === 1);
    const nested = scopes('item-note')[0];
    const hierarchy = container.querySelector('[aria-label="Runtime scope hierarchy"]')!;
    const nestedRow = hierarchy.querySelector<HTMLElement>('[data-scope-id="' + nested.scopeId + '"]')!;
    expect(nestedRow.parentElement?.closest('[data-scope-id]')?.getAttribute('data-scope-id')).toBe(a.scopeId);
    expect(hierarchy.textContent).toContain(a.scopeId); expect(hierarchy.textContent).toContain(b.scopeId);
    expect(hierarchy.textContent).toContain('view'); expect(hierarchy.textContent).toContain('activation');
    expect(nested.origin).toMatchObject({ definitionCache: 'view', scopeLifetime: 'activation', requestPath: '/api/ui/fragments/item-note/workspace--item-1' });
    const schemaLog = container.querySelector('[aria-label="Schema loading log"]')!;
    const dataLog = container.querySelector('[aria-label="Datasource lifecycle log"]')!;
    expect(schemaLog.textContent).toContain('/api/ui/fragments/item-note/workspace--item-1');
    expect(dataLog.textContent).not.toContain('/api/ui/fragments/');
    expect(dataLog.textContent).toContain('/api/items'); expect(dataLog.textContent).toContain(a.scopeId);
    const noteInput = left.querySelector<HTMLInputElement>('.ui-card-body input[type=text]')!;
    noteInput.focus();
    const beforeInspection = environment.store.getState(); const beforeInspectionRequests = requests.length;
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', ctrlKey: true, altKey: true })));
    const liveInspector = document.querySelector('[role="dialog"][aria-label="Live Runtime Inspector"]')!;
    expect(liveInspector.textContent).toContain(nested.scopeId); expect(liveInspector.textContent).toContain(a.scopeId);
    expect(liveInspector.textContent).toContain('PLAYGROUND TOOLING');
    expect(environment.store.getState()).toBe(beforeInspection); expect(requests).toHaveLength(beforeInspectionRequests);
    await click(button(liveInspector, 'Close live inspector'));
    // Flush the dialog's exit commit separately from each animation frame.
    for (let frame = 0; frame < 30 && document.activeElement !== noteInput; frame++)
      await act(async () => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    expect(document.activeElement).toBe(noteInput);
    expect(pane().getAttribute('aria-hidden')).not.toBe('true');
    expect(pane()).not.toBeNull(); expect(nested.active()).toBe(true);
    expect(nested.parentScope).toBe(a); expect(nested.viewScope).toBe(a.viewScope);
    expect(calls('/api/ui/fragments/item-note/workspace--item-1')).toHaveLength(1); expect(state(b).state.selectedId).toBeNull();
    await input(left.querySelector<HTMLInputElement>('.ui-card-body input[type=text]')!, 'Only nested A');
    expect(state(nested).state.note).toBe('Only nested A'); expect(state(a).state.query).toBe('');
    await click(right.querySelector<HTMLButtonElement>('.ui-list li button')); await until(() => scopes('item-note').length === 2);
    const other = scopes('item-note').find(scope => scope !== nested)!; expect(other.parentScope).toBe(b); expect(state(other).state.note).toBe('');
    expect(calls('/api/ui/fragments/item-note/workspace--item-1')).toHaveLength(1);
    await click(left.querySelectorAll<HTMLButtonElement>('.ui-list li button')[1]); await until(() => scopes('item-note').length === 2 && scopes('item-note').every(scope => scope !== nested));
    expect(nested.active()).toBe(false); expect(state(other).state.note).toBe(''); await close(); expect(environment.store.getState().fragments).toEqual({});
  }, 15000);
  it('cancels superseded slow requests and recursively disposes pending work when closed', async () => {
    await open(); const [a, b] = scopes(); const [left] = instances(); await click(toggle(left, 'Slow requests'));
    await until(() => state(a).data.items.loading && calls('/api/items').some(request => request.url.searchParams.get('slow') === 'true'));
    const old = calls('/api/items').at(-1)!; await input(left.querySelector('input[type=search]')!, 'revenue');
    await until(() => calls('/api/items').some(request => request.url.searchParams.get('search') === 'revenue'));
    expect(old.signal?.aborted).toBe(true); expect(state(b).data.items.status).toBe('success');
    await until(() => state(a).data.items.status === 'success'); expect(listCount(left)).toBe(1);
    await input(left.querySelector('input[type=search]')!, 'team'); await until(() => calls('/api/items').some(request => request.url.searchParams.get('search') === 'team'));
    const pending = calls('/api/items').at(-1)!; await close(); expect(pending.signal?.aborted).toBe(true); expect(environment.store.getState().fragments).toEqual({});
    expect(environment.dependencyGraph.registrations().some(entry => entry.target.scopeId === a.scopeId || entry.target.scopeId === b.scopeId)).toBe(false);
  });
  it('replaces context scopes and resets local state while reusing definition JSON on reopen', async () => {
    await open(); const [a] = scopes(); const [left] = instances();
    await click(left.querySelector<HTMLButtonElement>('.ui-list li button')); await until(() => scopes('item-note').length === 1);
    const nested = scopes('item-note')[0];
    await input(left.querySelector('input[type=search]')!, 'revenue');
    await chooseOption(pane(), 'Fragment context', 'Finance'); await until(() => scopes().length === 2 && scopes().every(scope => state(scope).data.items.status === 'success'));
    expect(nested.active()).toBe(false); expect(scopes('item-note')).toEqual([]); expect(pane().querySelectorAll('input[placeholder="Only this nested instance…"]')).toHaveLength(0);
    expect(scopes().every(scope => state(scope).state.selectedId === null)).toBe(true);
    expect(a.active()).toBe(false); expect(scopes().every(scope => state(scope).state.query === '')).toBe(true); expect(instances().every(instance => listCount(instance) === 4)).toBe(true);
    const old = scopes().map(scope => scope.scopeId); await close(); await open();
    expect(scopes().every(scope => !old.includes(scope.scopeId))).toBe(true); expect(calls('/api/ui/fragments/items-panel/finance')).toHaveLength(1);
  });
  it('offers the same HTTP-loaded workbench in Users mode and disposes fragments on view replacement', async () => {
    await open(); const first = scopes(); await close(); await chooseOption(container, 'Demo Schema', 'Users Catalog'); await until(() => environment.store.getState().viewData.users?.status === 'success');
    await open(); expect(first.every(scope => !scope.active())).toBe(true); expect(scopes().every(scope => scope.viewScope?.definition.id === 'users.catalog')).toBe(true);
    expect(calls('/api/ui/fragments/items-panel/workspace')).toHaveLength(2);
    // Explicit host view replacement ends the whole fragment subtree, even with cached JSON.
    await act(async () => environment.viewScope!.dispose()); expect(environment.store.getState().fragments).toEqual({});
  });
});


