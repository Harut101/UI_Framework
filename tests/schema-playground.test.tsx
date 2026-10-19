import {chooseOption} from './fluent-helpers';
// @vitest-environment jsdom
import './fluent-setup';
import { act } from 'react';
import type {Root} from 'react-dom/client';
import {createFluentRoot as createRoot} from './fluent-root';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SchemaPlaygroundTab } from '../src/playground/schema-tab/SchemaPlaygroundTab';
import { schemaSamples } from '../src/playground/schema-tab/samples';
import { createComponentRegistry } from '../src/components/registry';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ApplicationRuntime } from '../src/runtime/application/ApplicationRuntime';
import { applicationDefinition } from '../src/schemas';
import type { ApiTransport } from '../src/runtime/datasource/api';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let environment: RuntimeEnvironment;
let appRuntime: ApplicationRuntime;
let transport: ReturnType<typeof vi.fn<ApiTransport>>;
beforeEach(async () => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  transport = vi.fn<ApiTransport>(async () => ({ items: [{ id: 'one', title: 'First backend item', description: 'Loaded by the manager' }] }));
  environment = new RuntimeEnvironment(vi.fn(), vi.fn(), transport);
  appRuntime = new ApplicationRuntime(applicationDefinition, environment);
  await act(async () => root.render(<Provider store={environment.store}><SchemaPlaygroundTab environment={environment} registry={createComponentRegistry()}/></Provider>));
});
afterEach(async () => { await act(async () => root.unmount()); appRuntime.dispose(); container.remove(); vi.restoreAllMocks(); });
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
async function click(name: string) {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === name);
  expect(button, `Missing button ${name}`).toBeDefined(); await act(async () => { button!.click(); await tick(); });
}
async function edit(value: string) {
  const editor = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="View schema JSON"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(editor, value);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function sample(id:string){const entry=schemaSamples.find(sample=>sample.id===id)!;await chooseOption(container,'Sample schema',entry.label);}
describe('editable schema playground', () => {
  it('applies a valid text edit automatically through a new ViewRuntime', async () => {
    const firstInstance = environment.store.getState().viewInstance;
    const definition = JSON.parse(schemaSamples[2].source); definition.initialState.message = 'Changed in JSON';
    await edit(JSON.stringify(definition));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 330)); });
    expect(container.querySelector('.schema-render-canvas .runtime-page > p')?.textContent).toBe('Changed in JSON');
    expect(environment.store.getState().viewState.message).toBe('Changed in JSON');
    expect(environment.store.getState().viewInstance).not.toBe(firstInstance);
  });
  it('preserves the last valid preview across parse and validation errors', async () => {
    await click('Update message'); const firstInstance = environment.store.getState().viewInstance;
    await edit('{'); await click('Apply now');
    expect(container.querySelector('.schema-validation-error')?.textContent).toContain('JSON parse error');
    expect(container.querySelector('.schema-preview-status')?.textContent).toBe('Last valid view');
    expect(environment.store.getState().viewState.message).toBe('Updated through the runtime.');
    await edit('{}'); await click('Apply now');
    expect(container.querySelector('.schema-validation-error')?.textContent).toContain('Validation error');
    expect(environment.store.getState().viewInstance).toBe(firstInstance);
    await click('Reset');
    expect(container.querySelector('.schema-validation-error')).toBeNull();
    expect(environment.store.getState().viewState.message).toBe('Waiting for a named action.');
  });
  it('formats JSON without resetting view state and resets even if the source is unchanged', async () => {
    const definition = JSON.parse(schemaSamples[2].source);
    await edit(JSON.stringify(definition)); await click('Apply now'); await click('Update message');
    const firstInstance = environment.store.getState().viewInstance;
    await click('Format JSON');
    expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe(JSON.stringify(definition, null, 2));
    expect(environment.store.getState().viewInstance).toBe(firstInstance);
    expect(environment.store.getState().viewState.message).toBe('Updated through the runtime.');
    await click('Reset');
    expect(environment.store.getState().viewInstance).not.toBe(firstInstance);
    expect(environment.store.getState().appState).toEqual(applicationDefinition.initialState);
  });
  it('wires visibility through the real switch callback, action, store, and selectors', async () => {
    await sample('visibility');
    expect(container.querySelector('.schema-render-canvas')?.textContent).not.toContain('Advanced settings');
    const toggle = container.querySelector<HTMLInputElement>('.schema-render-canvas input[role="switch"]')!;
    await act(async () => { toggle.click(); await tick(); });
    expect(environment.store.getState().viewState.showAdvanced).toBe(true);
    expect(container.querySelector('.schema-render-canvas')?.textContent).toContain('Advanced settings');
    expect(environment.diagnostics.snapshot()).toContainEqual(expect.objectContaining({ kind: 'action', label: 'setShowAdvanced', detail: 'state.set' }));
    await act(async () => { toggle.click(); await tick(); });
    expect(environment.store.getState().viewState.showAdvanced).toBe(false);
    expect(container.querySelector('.schema-render-canvas')?.textContent).not.toContain('Advanced settings');
  });
  it('loads a datasource through the manager and resolves null/missing paths safely', async () => {
    const pending = new Promise<unknown>(resolve => setTimeout(() => resolve({ items: [{ id: 'one', title: 'First backend item' }] }), 10));
    transport.mockImplementationOnce(() => pending);
    await sample('datasource');
    expect(transport).toHaveBeenCalledWith(expect.objectContaining({ path: '/api/items', query: { search: '', fail: false, slow: false } }), expect.any(AbortSignal));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(environment.store.getState().viewData.items.status).toBe('success');
    expect(container.querySelector('.schema-render-canvas')?.textContent).toContain('First backend item');
    const definition = JSON.parse(schemaSamples[2].source);
    definition.root.children[0].bindings.value = { source: '$data.missing.data.value', default: 'Safe fallback' };
    await edit(JSON.stringify(definition)); await click('Apply now');
    expect(container.querySelector('.schema-render-canvas')?.textContent).toContain('Safe fallback');
    expect(container.querySelector('.schema-render-error')).toBeNull();
  });
  it('aborts a datasource request when the user changes samples', async () => {
    transport.mockImplementation(() => new Promise(() => undefined));
    await sample('datasource'); const signal = transport.mock.calls[0][1];
    expect(signal.aborted).toBe(false);
    await sample('nested-layout');
    expect(signal.aborted).toBe(true);
    expect(container.querySelector('.schema-render-canvas')?.textContent).toContain('Workspace overview');
    expect(environment.store.getState().viewData).toEqual({});
  });
  it('contains a render error and recovers after correcting valid JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Fragile({ value }: { value: string }) { if (value === 'bad') throw new Error('Component refused bad value'); return <p>{value}</p>; }
    const registry = createComponentRegistry().register('fragile', Fragile);
    await act(async () => root.render(<Provider store={environment.store}><SchemaPlaygroundTab environment={environment} registry={registry}/></Provider>));
    const definition = JSON.parse(schemaSamples[2].source); definition.root = { id: 'fragile', type: 'fragile', props: { value: 'bad' } };
    await edit(JSON.stringify(definition)); await click('Apply now');
    expect(container.querySelector('.schema-render-error')?.textContent).toContain('Component refused bad value');
    expect(container.querySelector('.schema-preview-status')?.textContent).toBe('Render failed');
    expect(container.querySelector('textarea')).not.toBeNull();
    definition.root.props.value = 'Recovered';
    await edit(JSON.stringify(definition)); await click('Apply now');
    expect(container.querySelector('.schema-render-error')).toBeNull();
    expect(container.querySelector('.schema-render-canvas')?.textContent).toContain('Recovered');
  });
  it('shows all four inspector namespaces with live view values', async () => {
    await click('Runtime inspector'); await click('Update message');
    const inspector = container.querySelector('.schema-runtime-inspector')!;
    expect([...inspector.querySelectorAll('.fui-AccordionHeader code')].map(item => item.textContent)).toEqual(['$appState', '$appData', '$state', '$data']);
    expect(inspector.textContent).toContain('Updated through the runtime.');
    expect(inspector.textContent).toContain('Schema Runtime Playground');
    await click('Hide inspector'); expect(container.querySelector('.schema-runtime-inspector')).toBeNull();
  });
  it('supports keyboard commit and an escape from Tab indentation for focus navigation', async () => {
    const definition = JSON.parse(schemaSamples[2].source); definition.initialState.message = 'Keyboard update';
    await edit(JSON.stringify(definition));
    const editor = container.querySelector<HTMLTextAreaElement>('textarea')!;
    await act(async () => { editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true })); await tick(); });
    expect(environment.store.getState().viewState.message).toBe('Keyboard update');
    await act(async () => editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true })));
    expect(container.querySelector('.schema-editor-status')?.textContent).toContain('Tab moves focus');
  });
});
