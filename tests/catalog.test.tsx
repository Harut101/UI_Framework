// @vitest-environment jsdom
import './fluent-setup';
import { act } from 'react';
import type {Root} from 'react-dom/client';
import {createFluentRoot as createRoot} from './fluent-root';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentsTab } from '../src/playground/components-tab/ComponentsTab';
import { createComponentRegistry } from '../src/components/registry';
import { RuntimeContext, RuntimeNode } from '../src/runtime/rendering/RuntimeNode';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import type { ViewDefinition } from '../src/runtime/view/types';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(<ComponentsTab registry={createComponentRegistry()}/>));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function click(text: string) {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === text);
  expect(button, `Missing button ${text}`).toBeDefined();
  await act(async () => button!.click());
}
async function inputValue(element: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
describe('interactive catalog', () => {
  it('filters by schema type and recovers from an empty search', async () => {
    const input = container.querySelector<HTMLInputElement>('.catalog-sidebar input')!;
    await inputValue(input, 'generic-navigation');
    expect(container.querySelectorAll('.catalog-category button')).toHaveLength(1);
    await click('GenericNavigation');
    expect(container.querySelector('#catalog-component-name')?.textContent).toContain('GenericNavigation');
    await inputValue(input, 'missing-component');
    expect(container.querySelectorAll('.catalog-category button')).toHaveLength(0);
    expect(container.querySelector('.catalog-empty-search')?.textContent).toContain('No components match');
    await click('Clear search');
    expect(container.querySelectorAll('.catalog-category button')).toHaveLength(19);
  });
  it('uses the actual button callback, supports disabled, and resets preview state', async () => {
    await click('Save changes');
    expect(container.querySelector('.catalog-preview-canvas button')?.textContent).toBe('Saved (1)');
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('onClick');
    const disabled = container.querySelector<HTMLInputElement>('.catalog-preview-controls input[type="checkbox"]')!;
    await act(async () => disabled.click());
    expect(container.querySelector<HTMLButtonElement>('.catalog-preview-canvas button')?.disabled).toBe(true);
    await click('Reset preview');
    expect(container.querySelector('.catalog-preview-canvas button')?.textContent).toBe('Save changes');
    expect(container.querySelector('.catalog-callback-log')?.textContent).not.toContain('No payload');
  });
  it('updates controlled text and logs the plain value payload', async () => {
    await click('TextInput');
    const field = container.querySelector<HTMLInputElement>('.catalog-preview-canvas input')!;
    await inputValue(field, 'A new workspace');
    expect(field.value).toBe('A new workspace');
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('"value":"A new workspace"');
  });
  it('emits SearchInput Enter and clear callbacks', async () => {
    await click('SearchInput');
    const field = container.querySelector<HTMLInputElement>('.catalog-preview-canvas input')!;
    await inputValue(field, 'revenue');
    await act(async () => field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('onSearch');
    const clear = container.querySelector<HTMLElement>('.catalog-preview-canvas [aria-label="Clear search reports"]')!;
    await act(async () => clear.click());
    expect(field.value).toBe('');
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('"value":""');
  });
  it('selects navigation items and honors the loading prop', async () => {
    await click('GenericNavigation');
    const buttons = container.querySelectorAll<HTMLButtonElement>('.catalog-preview-canvas nav button');
    await act(async () => buttons[1].click());
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('"value":"reports"');
    const loading = container.querySelector<HTMLInputElement>('.catalog-preview-controls input[type="checkbox"]')!;
    await act(async () => loading.click());
    expect(buttons[1].disabled).toBe(true);
    expect(container.querySelector('.catalog-preview-canvas')?.textContent).toContain('Loading navigation');
  });
  it('shows the list empty state and emits domain card intents', async () => {
    await click('GenericList');
    const empty = container.querySelectorAll<HTMLInputElement>('.catalog-preview-controls input[type="checkbox"]')[1];
    await act(async () => empty.click());
    expect(container.querySelector('.catalog-preview-canvas')?.textContent).toContain('No items to display.');
    await click('ReportCard'); await click('Open report');
    expect(container.querySelector('.ui-report-card')?.classList.contains('selected')).toBe(true);
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('"value":"report-1"');
    await click('UserCard'); await click('View profile'); await click('Message');
    expect(container.querySelector('.ui-user-card')?.classList.contains('selected')).toBe(true);
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('onMessage');
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('"value":"user-1"');
  });
  it('closes and restores a controlled SidePanel', async () => {
    await click('SidePanel');
    const close = document.querySelector<HTMLButtonElement>('button[aria-label="Close record details"]')!;
    await act(async () => close.click());
    expect(document.querySelector('.ui-side-panel')).toBeNull();
    expect(container.querySelector('.catalog-callback-log')?.textContent).toContain('onClose');
    await click('Reset preview'); expect(document.querySelector('.ui-side-panel')).not.toBeNull();
  });
  it('renders every registered catalog entry with both usage examples and its contracts', async () => {
    const names = [...container.querySelectorAll<HTMLButtonElement>('.catalog-category button')].map(button => button.textContent!.trim());
    for (const name of names) {
      await click(name);
      expect(container.querySelector('#catalog-component-name')?.textContent).toContain(name);
      expect(container.querySelector('.catalog-preview-canvas')?.childElementCount).toBeGreaterThan(0);
      expect(container.querySelector('.catalog-contract')?.textContent).toContain('Public props');
      expect(container.querySelector('.catalog-contract')?.textContent).toContain('Callback props');
      expect(container.querySelectorAll('.catalog-code-example')).toHaveLength((['Text', 'Title', 'Card', 'Stack', 'Page', 'SplitLayout'].includes(name) ? 2 : 3));
    }
  });
});
describe('shared components in schema runtime', () => {
  it('wires the same GenericNavigation implementation to a named state.set action', async () => {
    const registry = createComponentRegistry();
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), async () => null);
    const definition: ViewDefinition = { id: 'navigation-test', title: 'Navigation', initialState: { selectedId: 'overview' }, dataSources: {}, actions: { selectItem: { type: 'state.set', target: 'selectedId', value: '$event.value' } }, root: { id: 'navigation', type: 'generic-navigation', props: { items: [{ id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports' }] }, bindings: { selectedId: '$state.selectedId' }, handlers: { onSelect: { action: 'selectItem' } } } };
    const runtime = new ViewRuntime(definition, environment);
    try {
      await act(async () => root.render(<Provider store={environment.store}><RuntimeContext.Provider value={{ runtime, registry }}><RuntimeNode definition={definition.root}/></RuntimeContext.Provider></Provider>));
      const buttons = container.querySelectorAll<HTMLButtonElement>('nav button');
      await act(async () => buttons[1].click());
      expect(environment.store.getState().viewState.selectedId).toBe('reports');
      expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    } finally { await act(async () => runtime.dispose()); }
  });
});
