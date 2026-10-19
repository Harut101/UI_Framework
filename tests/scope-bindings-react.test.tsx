// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiTransport } from '../src/runtime/datasource/api';
import { registerSchemaOutlet } from '../src/runtime/schema/SchemaOutlet';
import { RuntimeScope } from '../src/runtime/shared/RuntimeScope';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ComponentRegistry } from '../src/runtime/rendering/ComponentRegistry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import type { ComponentDefinition, RuntimeScopeDefinition } from '../src/runtime/shared/types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let application: RuntimeScope;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); application?.dispose(); container.remove(); });
function definition(name: string): RuntimeScopeDefinition {
  return { id: 'shared', initialState: { name, query: name, visible: true }, dataSources: {}, actions: {
    change: { type: 'state.set', target: 'query', value: '$event.value' },
    toggle: { type: 'state.set', target: 'visible', value: '$event.value' },
  } };
}
function setup(transport: ApiTransport = async () => null) {
  const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  application = new RuntimeScope(definition('app'), 'application', environment);
  const view = new RuntimeScope(definition('view'), 'view', environment, application);
  const a = new RuntimeScope(definition('A'), 'fragment', environment, view);
  const b = new RuntimeScope(definition('B'), 'fragment', environment, view);
  const renders: Record<string, number> = {};
  function Probe({ name, value, items, options }: { name: string; value: string; items: unknown[]; options: object }) {
    renders[name] = (renders[name] ?? 0) + 1;
    return <span data-probe={name}>{value}|{items.length}|{Object.keys(options).length}</span>;
  }
  function Control({ onChange, onToggle }: { onChange: (event: unknown) => void; onToggle: (event: unknown) => void }) {
    return <><button onClick={() => onChange({ value: 'edited' })}>Edit</button><button onClick={() => onToggle({ value: false })}>Hide</button></>;
  }
  const registry = new ComponentRegistry().register('page', ({ children }: { children?: ReactNode }) => <div>{children}</div>)
    .register('probe', Probe).register('control', Control);
  const tree: ComponentDefinition = { id: 'page', type: 'page', children: [
    { id: 'nested', type: 'page', children: [{ id: 'probe', type: 'probe', visibility: '$state.visible', bindings: {
      name: '$state.name', value: '$state.query', items: { source: '$data.absent.data.items', default: [] }, options: { source: '$state.options', default: {} },
    } }] },
    { id: 'controls', type: 'control', handlers: { onChange: { action: 'change' }, onToggle: { action: 'toggle' } } },
  ] };
  const renderScope = (scope: RuntimeScope, definition = tree) => <RuntimeContext.Provider key={scope.scopeId + definition.id} value={{ runtime: scope, registry }}><RuntimeNode definition={definition}/></RuntimeContext.Provider>;
  return { environment, view, a, b, tree, renders, renderScope, registry };
}

describe('RuntimeNode scope subscriptions', () => {
  it('inherits scope through normal children and sends generated callbacks to the correct fragment', async () => {
    const { environment, a, b, renderScope, renders } = setup();
    await act(async () => root.render(<Provider store={environment.store}>{renderScope(a)}{renderScope(b)}</Provider>));
    expect(container.querySelector('[data-probe=A]')?.textContent).toBe('A|0|0');
    expect(container.querySelector('[data-probe=B]')?.textContent).toBe('B|0|0');
    expect(renders).toEqual({ A: 1, B: 1 });
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(environment.store.getState().fragments[a.scopeId].state.query).toBe('edited');
    expect(environment.store.getState().fragments[b.scopeId].state.query).toBe('B');
    expect(container.querySelector('[data-probe=A]')?.textContent).toBe('edited|0|0');
    expect(renders).toEqual({ A: 2, B: 1 });
    await act(async () => [...container.querySelectorAll('button')].find(button => button.textContent === 'Hide')!.click());
    expect(container.querySelector('[data-probe=A]')).toBeNull();
    expect(container.querySelector('[data-probe=B]')).not.toBeNull();
    await act(async () => a.actionEngine.execute('toggle', { event: { value: true } }));
    expect(container.querySelector('[data-probe=A]')?.textContent).toBe('edited|0|0');
  });
  it('rerenders owning-view/application bindings while keeping unrelated local props and defaults stable', async () => {
    const { environment, view, a, renderScope, renders } = setup();
    const ancestorTree: ComponentDefinition = { id: 'ancestors', type: 'page', children: [
      { id: 'view', type: 'probe', props: { name: 'view-probe', items: [], options: {} }, bindings: { value: '$viewState.query' }, visibility: '$viewState.visible' },
      { id: 'app', type: 'probe', props: { name: 'app-probe', items: [], options: {} }, bindings: { value: '$appState.query' } },
    ] };
    await act(async () => root.render(<Provider store={environment.store}>{renderScope(a)}{renderScope(a, ancestorTree)}</Provider>));
    const baseline = { ...renders };
    await act(async () => view.actionEngine.execute('change', { event: { value: 'view edited' } }));
    expect(container.querySelector('[data-probe=view-probe]')?.textContent).toContain('view edited');
    expect(renders.A).toBe(baseline.A); expect(renders['app-probe']).toBe(baseline['app-probe']);
    await act(async () => application.actionEngine.execute('change', { event: { value: 'app edited' } }));
    expect(container.querySelector('[data-probe=app-probe]')?.textContent).toContain('app edited');
    expect(renders.A).toBe(baseline.A);
    await act(async () => view.actionEngine.execute('toggle', { event: { value: false } }));
    expect(container.querySelector('[data-probe=view-probe]')).toBeNull();
    expect(container.querySelector('[data-probe=A]')).not.toBeNull();
  });
  it('switches the same node definition to a different current scope through RuntimeContext', async () => {
    const { environment, a, b, tree } = setup();
    const registry = new ComponentRegistry().register('page', ({ children }: { children?: ReactNode }) => <div>{children}</div>)
      .register('probe', ({ value }: { value: string }) => <span>{value}</span>).register('control', () => null);
    const node = <RuntimeNode definition={tree}/>;
    await act(async () => root.render(<Provider store={environment.store}><RuntimeContext.Provider value={{ runtime: a, registry }}>{node}</RuntimeContext.Provider></Provider>));
    expect(container.textContent).toBe('A');
    await act(async () => root.render(<Provider store={environment.store}><RuntimeContext.Provider value={{ runtime: b, registry }}>{node}</RuntimeContext.Provider></Provider>));
    expect(container.textContent).toBe('B');
    await act(async () => a.actionEngine.execute('change', { event: { value: 'old scope' } }));
    expect(container.textContent).toBe('B');
  });
});



describe('legacy remote trees inherit their host scope', () => {
  it('resolves outlet key/enabled and loaded child bindings independently for each fragment context', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ id: 'loaded', type: 'probe', props: { items: [], options: {} }, bindings: { name: '$state.name', value: '$state.query' } }));
    const { environment, a, b, renderScope, registry } = setup(transport);
    registerSchemaOutlet(registry).register('error-message', ({ text }: { text: string }) => <span>{text}</span>).register('spinner', () => <span>Loading</span>);
    const source = { request: { path: '/api/$state.query', query: { owner: '$viewState.query' } }, load: { strategy: 'onDemand' as const } };
    a.definition.schemaSources = { local: source }; b.definition.schemaSources = { local: source };
    const outlet: ComponentDefinition = { id: 'outlet', type: 'schema-outlet', source: 'local', key: '$state.query', enabled: '$state.visible' };
    await act(async () => { root.render(<Provider store={environment.store}>{renderScope(a, outlet)}{renderScope(b, outlet)}</Provider>); });
    expect(transport.mock.calls.map(([request]) => request.path)).toEqual(['/api/A', '/api/B']);
    expect(transport.mock.calls.every(([request]) => request.query?.owner === 'view')).toBe(true);
    expect(container.querySelector('[data-probe=A]')?.textContent).toBe('A|0|0');
    expect(container.querySelector('[data-probe=B]')?.textContent).toBe('B|0|0');
    expect(environment.listScopes()).toHaveLength(4);
    await act(async () => a.actionEngine.execute('toggle', { event: { value: false } }));
    expect(container.querySelector('[data-probe=A]')).toBeNull(); expect(container.querySelector('[data-probe=B]')).not.toBeNull();
    expect(transport).toHaveBeenCalledTimes(2);
  });
});

