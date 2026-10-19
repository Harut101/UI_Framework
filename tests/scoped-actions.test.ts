import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ComponentBinder } from '../src/runtime/rendering/ComponentBinder';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { validateViewDefinition } from '../src/runtime/shared/validation';
import type { ApiTransport } from '../src/runtime/datasource/api';
import type { RuntimeScopeDefinition } from '../src/runtime/shared/types';
import type { ExecutionContext } from '../src/runtime/actions/types';

const roots: RuntimeScope[] = [];
function definition(query: string): RuntimeScopeDefinition {
  return {
    id: 'shared', initialState: { query, filters: { query, keep: true }, destination: '/demo/' + query },
    dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items', query: { query: '$state.query' } }, load: { strategy: 'manual' } } },
    actions: {
      setQuery: { type: 'state.set', target: 'query', value: '$event.value' },
      patchFilters: { type: 'state.patch', target: 'filters', value: { query: '$state.query', selected: '$event.value' } },
      patchRoot: { type: 'state.patch', value: { copied: '$state.query', eventValue: '$event.value' } },
      fetch: { type: 'api.request', request: { method: 'POST', path: '/api/save', body: { query: '$state.query', event: '$event.value', view: '$viewState.query', app: '$appState.query' } }, target: 'result', onSuccess: 'success', onError: 'failure' },
      recordSuccess: { type: 'state.patch', value: { received: '$response.id', eventValue: '$event.value' } },
      success: { type: 'sequence', actions: ['recordSuccess', 'successNotice'] },
      successNotice: { type: 'notification.show', message: '$response.id', tone: 'success' },
      recordError: { type: 'state.patch', value: { error: '$response.error', eventValue: '$event.value' } },
      failure: { type: 'sequence', actions: ['recordError', 'errorNotice'] },
      errorNotice: { type: 'notification.show', message: '$response.error', tone: 'error' },
      captureAfter: { type: 'state.patch', value: { afterResponse: '$response.id', afterError: '$response.error', afterQuery: '$state.query', afterEvent: '$event.value' } },
      nested: { type: 'sequence', actions: ['fetch', 'patchFilters'] },
      flow: { type: 'sequence', actions: ['setQuery', 'nested', 'captureAfter'] },
      reload: { type: 'datasource.reload', source: 'items' },
      invalidate: { type: 'datasource.invalidate', source: 'items' },
      go: { type: 'navigate', to: '$state.destination' },
      notice: { type: 'notification.show', message: '$state.query' },
    },
  };
}
function setup(transport: ApiTransport = vi.fn(async () => ({ id: 'saved' }))) {
  const navigate = vi.fn(); const notify = vi.fn();
  const environment = new RuntimeEnvironment(navigate, notify, transport);
  const app = new RuntimeScope(definition('app'), 'application', environment); roots.push(app);
  const view = new RuntimeScope(definition('view'), 'view', environment, app);
  const a = new RuntimeScope(definition('A'), 'fragment', environment, view);
  const b = new RuntimeScope(definition('B'), 'fragment', environment, view);
  const state = (scope: RuntimeScope) => environment.resolver.resolve('$state', { state: environment.store.getState(), scope }) as Record<string, unknown>;
  return { app, view, a, b, environment, navigate, notify, state, transport };
}
afterEach(() => { roots.splice(0).forEach(root => root.dispose()); vi.restoreAllMocks(); });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function deferred() {
  let resolve!: (value: unknown) => void; let reject!: (error: Error) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('named action resolution in RuntimeScope', () => {
  it('resolves duplicate action names in application, view, sibling and nested scopes independently', async () => {
    const { app, view, a, b, environment, state } = setup();
    const nested = new RuntimeScope(definition('nested'), 'fragment', environment, a);
    const scopes = [app, view, a, b, nested];
    for (const [index, scope] of scopes.entries()) {
      expect(scope.actionEngine.scope).toBe(scope); expect(scope.actionEngine.definitions).toBe(scope.actionDefinitions);
      await scope.actionEngine.execute('setQuery', { event: { value: 'edited-' + index }, scope });
    }
    expect(scopes.map(scope => state(scope).query)).toEqual(['edited-0', 'edited-1', 'edited-2', 'edited-3', 'edited-4']);
    expect(scopes.every(scope => scope.environment.actionRegistry === environment.actionRegistry)).toBe(true);
  });
  it('keeps named action ids distinct from generic registry types', async () => {
    const { a, environment, notify, state } = setup();
    await expect(a.actionEngine.execute('state.set', { scope: a })).rejects.toThrow('Unknown named action');
    a.actionDefinitions['state.set'] = { type: 'notification.show', message: 'A named action' };
    const genericHandler = environment.actionRegistry.get('state.set');
    const handler = vi.fn(genericHandler); environment.actionRegistry.register('state.set', handler);
    await a.actionEngine.execute('state.set', { scope: a });
    expect(notify).toHaveBeenCalledWith('A named action', 'info'); expect(handler).not.toHaveBeenCalled();
    await a.actionEngine.execute('setQuery', { scope: a, event: { value: 'new' } });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1].scope).toBe(a); expect(handler.mock.calls[0][0].type).toBe('state.set');
    expect(state(a).query).toBe('new');
  });
  it('does not look up missing names in parents, siblings or Object.prototype', async () => {
    const { app, view, a, b, state } = setup();
    app.actionDefinitions.parentOnly = { type: 'state.set', target: 'query', value: 'parent' };
    view.actionDefinitions.parentOnly = { type: 'state.set', target: 'query', value: 'view' };
    b.actionDefinitions.siblingOnly = { type: 'state.set', target: 'query', value: 'sibling' };
    for (const id of ['parentOnly', 'siblingOnly', 'toString', 'constructor'])
      await expect(a.actionEngine.execute(id, { scope: a })).rejects.toThrow('Unknown named action');
    expect(state(a).query).toBe('A'); expect(state(view).query).toBe('view');
  });
  it('retains omitted-scope compatibility while passing explicit scope to every generic handler', async () => {
    const { a, environment } = setup(); const handler = vi.fn();
    environment.actionRegistry.register('notification.show', handler);
    await a.actionEngine.execute('notice');
    expect(handler.mock.calls[0][1].scope).toBe(a);
  });
  it('rejects mismatched sibling, ancestor and foreign-environment contexts before execution', async () => {
    const { a, b, app, view, environment } = setup(); const foreign = setup().a;
    const before = environment.store.getState();
    for (const scope of [b, app, view, foreign]) {
      await expect(a.actionEngine.execute('setQuery', { scope, event: { value: 'wrong' } })).rejects.toThrow('Cross-scope');
      expect(() => a.actionEngine.resolve('$state.query', { scope })).toThrow('Cross-scope');
    }
    expect(environment.store.getState()).toBe(before);
  });
  it('keeps cycle detection local to the execution chain', async () => {
    const { a, b, state } = setup();
    a.actionDefinitions.loop = { type: 'sequence', actions: ['again'] };
    a.actionDefinitions.again = { type: 'sequence', actions: ['loop'] };
    await expect(a.actionEngine.execute('loop', { scope: a })).rejects.toThrow('loop → again → loop');
    await b.actionEngine.execute('setQuery', { scope: b, event: { value: 'B still works' } });
    expect(state(b).query).toBe('B still works');
  });
});

describe('scoped state mutations and generated handlers', () => {
  it('updates only the fragment query and preserves all host/sibling state and data references', async () => {
    const { a, b, environment, state } = setup(); const before = environment.store.getState();
    await a.actionEngine.execute('setQuery', { event: { value: 'fragment only', scope: b }, scope: a });
    const after = environment.store.getState();
    expect(state(a).query).toBe('fragment only');
    expect(after.fragments[b.scopeId]).toBe(before.fragments[b.scopeId]);
    expect(after.fragments[a.scopeId].data).toBe(before.fragments[a.scopeId].data);
    expect(after.appState).toBe(before.appState); expect(after.viewState).toBe(before.viewState);
    expect(after.appData).toBe(before.appData); expect(after.viewData).toBe(before.viewData);
  });
  it('patches local root and nested paths without losing fields or modifying host state', async () => {
    const { a, environment, state } = setup(); const host = environment.store.getState().viewState;
    await a.actionEngine.execute('setQuery', { scope: a, event: { value: 'edited' } });
    await a.actionEngine.execute('patchFilters', { scope: a, event: { value: 'selected' } });
    await a.actionEngine.execute('patchRoot', { scope: a, event: { value: 'payload' } });
    expect(state(a)).toMatchObject({ query: 'edited', filters: { query: 'edited', keep: true, selected: 'selected' }, copied: 'edited', eventValue: 'payload' });
    expect(environment.store.getState().viewState).toBe(host);
  });
  it.each(['state.set', 'state.patch', 'api.request'] as const)('rejects expression-qualified %s write targets at validation and execution', async type => {
    const { a, environment, transport } = setup();
    a.actionDefinitions.invalid = type === 'api.request'
      ? { type, target: '$viewState.query', request: { method: 'POST', path: '/api/save' } }
      : type === 'state.patch' ? { type, target: '$viewState.query', value: { query: 'wrong' } }
      : { type, target: '$viewState.query', value: 'wrong' };
    const before = environment.store.getState();
    await expect(a.actionEngine.execute('invalid', { scope: a })).rejects.toThrow('relative to the current scope');
    expect(environment.store.getState()).toBe(before); expect(transport).not.toHaveBeenCalled();
    const registry = new ComponentRegistry().register('text', () => null);
    expect(() => validateViewDefinition({ ...a.definition, title: 'Invalid', root: { id: 'text', type: 'text' } }, registry)).toThrow('relative to the current scope');
  });
  it('ComponentBinder passes the exact payload and current scope to the named action', async () => {
    const { a, b, state } = setup(); const execute = vi.spyOn(a.actionEngine, 'execute');
    const props = new ComponentBinder().bind({ id: 'input', type: 'input', props: { label: 'Query' }, handlers: { onChange: { action: 'setQuery' } } }, a.actionEngine, a);
    const payload = { value: 'from callback', scope: b };
    (props.onChange as (event: unknown) => void)(payload); await tick();
    expect(execute).toHaveBeenCalledWith('setQuery', { event: payload, scope: a });
    expect(props.label).toBe('Query'); expect(state(a).query).toBe('from callback'); expect(state(b).query).toBe('B');
  });
  it('a stale generated callback cannot mutate a replacement activation', async () => {
    const { a, view, environment } = setup();
    const props = new ComponentBinder().bind({ id: 'input', type: 'input', handlers: { onChange: { action: 'setQuery' } } }, a.actionEngine, a);
    a.dispose(); const next = new RuntimeScope(definition('replacement'), 'fragment', environment, view);
    const before = environment.store.getState();
    (props.onChange as (event: unknown) => void)({ value: 'late' }); await tick();
    expect(environment.store.getState()).toBe(before); expect(environment.store.getState().fragments[next.scopeId].state.query).toBe('replacement');
  });
});

describe('sequences and API continuation context', () => {
  it('preserves scope, event and response through nested sequences and onSuccess actions', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ id: 'A-result' }));
    const { a, b, environment, notify, state } = setup(transport);
    const original = Object.freeze({ scope: a, event: { value: 'new query' }, response: { id: 'initial response' } });
    await a.actionEngine.execute('flow', original);
    expect(state(a)).toMatchObject({ query: 'new query', filters: { query: 'new query', selected: 'new query', keep: true }, result: { id: 'A-result' }, received: 'A-result', eventValue: 'new query', afterResponse: 'A-result', afterQuery: 'new query', afterEvent: 'new query' });
    expect(transport.mock.calls[0][0].body).toEqual({ query: 'new query', event: 'new query', view: 'view', app: 'app' });
    expect(transport.mock.calls[0][1]).toBe(a.signal);
    expect(state(b).query).toBe('B'); expect(environment.store.getState().viewState.query).toBe('view');
    expect(notify).toHaveBeenCalledWith('A-result', 'success'); expect(original.response.id).toBe('initial response');
    const logs = environment.diagnostics.snapshot().filter(entry => entry.kind === 'action');
    expect(logs.every(entry => entry.metadata?.instance === a.scopeId)).toBe(true);
  });
  it('preserves error response and event through onError and following sequence steps', async () => {
    const transport = vi.fn<ApiTransport>(async () => { throw new Error('Unavailable'); });
    const { a, b, notify, state } = setup(transport);
    await a.actionEngine.execute('flow', { scope: a, event: { value: 'retry query' } });
    expect(state(a)).toMatchObject({ error: 'Unavailable', eventValue: 'retry query', afterError: 'Unavailable', afterEvent: 'retry query', afterQuery: 'retry query' });
    expect(state(a).result).toBeUndefined(); expect(state(b).error).toBeUndefined();
    expect(notify).toHaveBeenCalledWith('Unavailable', 'error');
  });
  it('does not share response context between concurrent executions using the same caller payload', async () => {
    const first = deferred(); const second = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    const { a, b, state } = setup(transport);
    const caller: ExecutionContext = Object.freeze({ event: { value: 'shared input' }, response: { id: 'seed' } });
    const runA = a.actionEngine.execute('flow', caller); const runB = b.actionEngine.execute('flow', caller);
    await tick(); first.resolve({ id: 'response A' }); second.resolve({ id: 'response B' });
    await Promise.all([runA, runB]);
    expect(state(a)).toMatchObject({ received: 'response A', afterResponse: 'response A' });
    expect(state(b)).toMatchObject({ received: 'response B', afterResponse: 'response B' });
    expect(caller.response).toEqual({ id: 'seed' }); expect(caller.scope).toBeUndefined();
  });
  it.each(['onSuccess', 'onError'] as const)('does not fall back to parent %s actions', async continuation => {
    const transport = vi.fn<ApiTransport>(async () => { if (continuation === 'onError') throw new Error('HTTP failure'); return { id: 'saved' }; });
    const { a, view, state } = setup(transport);
    view.actionDefinitions.parentCallback = { type: 'state.set', target: 'query', value: 'parent changed' };
    a.actionDefinitions.request = { type: 'api.request', request: { method: 'POST', path: '/api/save' }, [continuation]: 'parentCallback' };
    await expect(a.actionEngine.execute('request', { scope: a })).rejects.toThrow('Unknown named action: parentCallback');
    expect(state(view).query).toBe('view'); expect(state(a).query).toBe('A');
  });
  it('propagates a failed success callback without treating it as an HTTP error', async () => {
    const { a, notify, state } = setup();
    a.actionDefinitions.fetch = { type: 'api.request', request: { method: 'POST', path: '/api/save' }, target: 'result', onSuccess: 'missing', onError: 'failure' };
    await expect(a.actionEngine.execute('fetch', { scope: a })).rejects.toThrow('Unknown named action');
    expect(state(a).result).toEqual({ id: 'saved' }); expect(state(a).error).toBeUndefined(); expect(notify).not.toHaveBeenCalled();
  });
  it.each(['resolve', 'reject'] as const)('stops continuations after disposal even when transport ignores abort and later %ss', async outcome => {
    const pending = deferred(); const transport = vi.fn<ApiTransport>(() => pending.promise);
    const { a, view, environment, notify } = setup(transport);
    const run = a.actionEngine.execute('flow', { scope: a, event: { value: 'before disposal' } });
    await tick(); a.dispose(); const next = new RuntimeScope(definition('replacement'), 'fragment', environment, view);
    const before = environment.store.getState();
    expect(transport.mock.calls[0][1].aborted).toBe(true);
    if (outcome === 'resolve') pending.resolve({ id: 'late' }); else pending.reject(new Error('late failure'));
    await run;
    expect(environment.store.getState()).toBe(before); expect(environment.store.getState().fragments[next.scopeId].state.query).toBe('replacement');
    expect(notify).not.toHaveBeenCalled();
  });
});

describe('other generic handlers keep scope ownership', () => {
  it('reloads/invalidates only the named datasource in the current scope', async () => {
    const transport = vi.fn<ApiTransport>(async request => ({ items: [request.query?.query] }));
    const { a, b, environment } = setup(transport); const before = environment.store.getState();
    await a.actionEngine.execute('reload', { scope: a });
    expect(environment.store.getState().fragments[a.scopeId].data.items).toMatchObject({ status: 'success', data: { items: ['A'] } });
    expect(environment.store.getState().fragments[b.scopeId]).toBe(before.fragments[b.scopeId]);
    await a.actionEngine.execute('invalidate', { scope: a });
    expect(environment.store.getState().fragments[a.scopeId].data.items).toMatchObject({ status: 'idle', data: null });
    expect(environment.store.getState().viewData).toBe(before.viewData); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('resolves navigation and notification values in the executing fragment', async () => {
    const { a, b, navigate, notify } = setup();
    await a.actionEngine.execute('go', { scope: a }); await b.actionEngine.execute('notice', { scope: b });
    expect(navigate).toHaveBeenCalledWith('/demo/A'); expect(notify).toHaveBeenCalledWith('B', 'info');
  });
});

