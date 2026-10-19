// @vitest-environment jsdom
import './fluent-setup';
import { act, StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createFluentRoot } from './fluent-root';
import { createComponentRegistry } from '../src/components/registry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import type { ComponentDefinition, ViewDefinition } from '../src/runtime/shared/types';
import type { ApiTransport } from '../src/runtime/datasource/api';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root; let container: HTMLDivElement; let runtime: ViewRuntime;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createFluentRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); runtime?.dispose(); container.remove(); });
function deferred() { let resolve!: (value: unknown) => void; const promise = new Promise<unknown>(yes => { resolve = yes; }); return { promise, resolve }; }
async function mount(transport: ApiTransport, custom?: ComponentDefinition, strict = false) {
  const registry = createComponentRegistry(); const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  const definition: ViewDefinition = { id: 'remote-demo', title: 'Remote', initialState: { selected: 'one', enabled: true, value: 'Initial' }, dataSources: {}, schemaSources: { remote: { request: { path: '/api/ui/$state.selected' }, load: { strategy: 'onDemand', cache: 'view' } } }, actions: {
    select: { type: 'state.set', target: 'selected', value: '$event.value' }, enable: { type: 'state.set', target: 'enabled', value: '$event.value' }, update: { type: 'state.set', target: 'value', value: 'Updated through named action' },
  }, root: custom ?? { id: 'dynamic', type: 'schema-outlet', source: 'remote', enabled: '$state.enabled', key: '$state.selected', loading: { id: 'loader', type: 'spinner', props: { label: 'Waiting for schema' } } } };
  runtime = new ViewRuntime(definition, environment);
  const element = <Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={definition.root}/></RuntimeContext.Provider></Provider>;
  await act(async () => root.render(strict ? <StrictMode>{element}</StrictMode> : element));
  return { environment, registry };
}
describe('SchemaOutlet uses the existing renderer', () => {
  it('shows localized loading, resolves the SAME registry, and binds returned children/actions via RuntimeNode', async () => {
    const pending = deferred(); const { registry, environment } = await mount(() => pending.promise);
    expect(container.textContent).toContain('Waiting for schema');
    const renders = vi.fn(); registry.register('probe', ({ value }: { value: string }) => { renders(value); return <p data-testid="registry-probe">{value}</p>; });
    await act(async () => pending.resolve({ id: 'remote-root', type: 'stack', children: [{ id: 'remote-text', type: 'probe', bindings: { value: '$state.value' } }, { id: 'remote-button', type: 'button', props: { label: 'Update remote content' }, handlers: { onClick: { action: 'update' } } }] }));
    expect(container.querySelector('[data-testid=registry-probe]')?.textContent).toBe('Initial');
    await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
    expect(container.textContent).toContain('Updated through named action'); expect(renders).toHaveBeenLastCalledWith('Updated through named action');
    expect(environment.store.getState().viewState.value).toBe('Updated through named action');
  });
  it('never displays the previous key and aborts the obsolete request', async () => {
    const first = deferred(); const second = deferred();
    const transport = vi.fn<ApiTransport>().mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    await mount(transport); await act(async () => runtime.actionEngine.execute('select', { event: { value: 'two' } }));
    expect(transport.mock.calls[0][1].aborted).toBe(true); expect(transport.mock.calls[1][0].path).toBe('/api/ui/two');
    await act(async () => second.resolve({ id: 'current', type: 'title', props: { value: 'Second tree' } }));
    await act(async () => first.resolve({ id: 'old', type: 'text', props: { value: 'Stale tree' } }));
    expect(container.textContent).toContain('Second tree'); expect(container.textContent).not.toContain('Stale tree');
  });
  it('renders a safe error, custom fallback and infrastructure retry', async () => {
    const transport = vi.fn<ApiTransport>().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ id: 'recovered', type: 'text', props: { value: 'Recovered tree' } });
    await mount(transport, { id: 'outlet', type: 'schema-outlet', source: 'remote', error: { id: 'error-note', type: 'text', props: { value: 'Custom unavailable message' } } });
    expect(container.textContent).toContain('Unable to load content'); expect(container.textContent).toContain('Custom unavailable message');
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry content')!.click());
    expect(container.textContent).toContain('Recovered tree'); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('enabled is reactive UI state and view cache survives deactivate/reactivate without another request', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ id: 'content', type: 'text', props: { value: 'Cached tree' } }));
    await mount(transport); expect(container.textContent).toContain('Cached tree');
    await act(async () => runtime.actionEngine.execute('enable', { event: { value: false } })); expect(container.textContent).not.toContain('Cached tree');
    await act(async () => runtime.actionEngine.execute('enable', { event: { value: true } })); expect(container.textContent).toContain('Cached tree'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('deduplicates StrictMode activation without losing the fragment', async () => {
    const transport = vi.fn<ApiTransport>(async () => ({ id: 'content', type: 'text', props: { value: 'Strict tree' } }));
    await mount(transport, undefined, true); expect(container.textContent).toContain('Strict tree'); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('contains adapter rendering errors locally and recovers through infrastructure retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const transport = vi.fn<ApiTransport>().mockResolvedValueOnce({ id: 'bad', type: 'generic-list', props: { items: null } }).mockResolvedValueOnce({ id: 'recovered', type: 'text', props: { value: 'Valid replacement' } });
      await mount(transport);
      expect(container.textContent).toContain('Unable to render loaded content');
      await act(async () => [...container.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent === 'Retry content')!.click());
      expect(container.textContent).toContain('Valid replacement');
    } finally { consoleError.mockRestore(); }
  });

});
