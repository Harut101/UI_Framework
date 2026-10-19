import { describe, expect, it, vi } from 'vitest';
import { Diagnostics, diagnosticDetail } from '../src/runtime/shared/Diagnostics';
import { RuntimeEnvironment } from '../src/runtime/shared/RuntimeEnvironment';
import { ViewRuntime } from '../src/runtime/view/ViewRuntime';
import { createComponentRegistry, registerApplicationComponents } from '../src/components/registry';
import { inspectDatasources, actionLogEntries, lifecycleLogEntries, formatInspectorValue, schemaId } from '../src/playground/application-tab/inspectorModel';
import { reportingApplicationDefinition, reportingCatalogDefinition, usersCatalogDefinition } from '../src/schemas/reporting';
import type { RuntimeState, ViewDefinition } from '../src/runtime/shared/types';

describe('read-only runtime inspection', () => {
  it('reads the active view and its graph declarations without including the previous view', () => {
    const state: RuntimeState = { fragments: {}, applicationInstance: null, schemaFragments: {}, appState: {}, appData: {}, viewState: {}, viewData: { users: { status: 'success', loading: false, data: { items: [] }, error: null } }, viewInstance: 'users.catalog:42' };
    const before = structuredClone(state);
    const sources = inspectDatasources({ ...reportingApplicationDefinition, views: { 'users.catalog': usersCatalogDefinition } }, state);
    expect(sources.map(source => source.key)).toEqual(['app:navigation', 'app:me', 'view:users']);
    expect(sources.find(source => source.key === 'view:users')).toMatchObject({ definition: usersCatalogDefinition.dataSources.users, entry: state.viewData.users, dependencies: ['$state.filters.department', '$state.filters.status', '$state.filters.search'] });
    expect(state).toEqual(before);
    expect(inspectDatasources(reportingApplicationDefinition, { ...state, viewInstance: null }).every(source => source.scope === 'app')).toBe(true);
    expect(schemaId('custom:catalog:17')).toBe('custom:catalog'); expect(schemaId(null)).toBeNull();
  });
  it('returns detached registry names and handles unresolved diagnostic values safely', () => {
    const registry = registerApplicationComponents(createComponentRegistry());
    const names = registry.list() as string[];
    expect(names).toContain('generic-navigation'); expect(names).toContain('user-list');
    names.length = 0;
    expect(registry.has('generic-navigation')).toBe(true); expect(registry.list().length).toBeGreaterThan(19);
    expect(formatInspectorValue(undefined)).toBe('undefined'); expect(formatInspectorValue('engineering')).toBe('"engineering"');
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect(formatInspectorValue(circular)).toBe('[Unserializable value]');
  });
  it('records actual resolved state values with the named action, type, scope and target', async () => {
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), vi.fn(async () => ({})));
    const runtime = new ViewRuntime(reportingCatalogDefinition, environment);
    try {
      await runtime.actionEngine.execute('selectModule', { event: { value: 'active-directory' } });
      const entries = actionLogEntries(environment.diagnostics.snapshot());
      expect(entries).toContainEqual(expect.objectContaining({ kind: 'state', detail: '"active-directory"', metadata: expect.objectContaining({ actionId: 'selectModule', actionType: 'state.set', target: 'filters.module', value: 'active-directory', scope: 'view', instance: runtime.instance }) }));
      expect(entries.filter(entry => entry.metadata?.actionId === 'selectModule')).toHaveLength(1);
    } finally { runtime.dispose(); }
  });
  it('keeps app and view datasource IDs distinct even when they share a name', () => {
    const application = { ...reportingApplicationDefinition, views: { 'users.catalog': usersCatalogDefinition }, dataSources: { users: { ...usersCatalogDefinition.dataSources.users, dependsOn: ['$appState.department' as const] } } };
    const sources = inspectDatasources(application, { fragments: {}, applicationInstance: null, schemaFragments: {}, appState: {}, appData: {}, viewState: {}, viewData: {}, viewInstance: 'users.catalog:1' });
    expect(sources.map(source => source.key)).toEqual(['app:users', 'view:users']);
    expect(sources[0].dependencies).toEqual(['$appState.department']);
  });
});

describe('diagnostic isolation and lifecycle telemetry', () => {
  it('snapshots metadata, bounds history, notifies on clear, and unsubscribes', () => {
    const diagnostics = new Diagnostics(); const observer = vi.fn(); const unsubscribe = diagnostics.subscribe(observer);
    const value = { selected: 'initial' };
    diagnostics.trace('state', 'selected', undefined, { value }); value.selected = 'mutated';
    expect(diagnostics.snapshot()[0].metadata?.value).toEqual({ selected: 'initial' });
    diagnostics.trace('state', 'unsupported', undefined, { value: () => undefined });
    expect(diagnostics.snapshot()[0].metadata?.value).toBe('[Unserializable diagnostic value]');
    expect(diagnosticDetail(1n)).toBe('[Unserializable diagnostic value]');
    for (let index = 0; index < 120; index++) diagnostics.trace('action', String(index));
    expect(diagnostics.snapshot()).toHaveLength(100);
    const calls = observer.mock.calls.length; diagnostics.clear();
    expect(diagnostics.snapshot()).toEqual([]); expect(observer).toHaveBeenCalledTimes(calls + 1);
    unsubscribe(); diagnostics.trace('action', 'after unsubscribe'); expect(observer).toHaveBeenCalledTimes(calls + 1);
  });
  it('contains a failing observer and cannot break action execution or datasource loading', async () => {
    const environment = new RuntimeEnvironment(vi.fn(), vi.fn(), vi.fn(async () => ({ items: [] })));
    const unsubscribe = environment.diagnostics.subscribe(() => { throw new Error('Broken playground observer'); });
    const definition: ViewDefinition = { id: 'observation', title: 'Observation', initialState: { selected: '' }, actions: { select: { type: 'state.set', target: 'selected', value: '$event.value' } }, dataSources: { items: { type: 'api', request: { method: 'GET', path: '/api/items' }, load: { strategy: 'manual' } } }, root: { id: 'root', type: 'page' } };
    const runtime = new ViewRuntime(definition, environment);
    try {
      await expect(runtime.actionEngine.execute('select', { event: { value: 'value' } })).resolves.toBeUndefined();
      await expect(runtime.dataSources.reload('items')).resolves.toBeUndefined();
      expect(environment.store.getState().viewState.selected).toBe('value');
      expect(environment.store.getState().viewData.items.status).toBe('success');
      expect(lifecycleLogEntries(environment.diagnostics.snapshot()).map(entry => entry.metadata?.event).reverse()).toEqual(['loading', 'success']);
      expect(() => environment.diagnostics.clear()).not.toThrow();
    } finally { runtime.dispose(); unsubscribe(); }
  });
});
