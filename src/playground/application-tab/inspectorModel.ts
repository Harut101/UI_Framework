import { readScopedPath } from '../../runtime/shared/scopeAddress';
import type { RuntimeEnvironment } from '../../runtime/shared/RuntimeEnvironment';
import type { RuntimeScope } from '../../runtime/shared/RuntimeScope';
import type { DataEntry, DependencyRegistration } from '../../runtime/shared/types';
import type { RuntimeState, ScopedChangedPath, TraceEntry } from '../../runtime/shared/types';

export function schemaId(instance: string | null | undefined): string | null {
  if (!instance) return null;
  const separator = instance.lastIndexOf(':');
  return separator < 0 ? instance : instance.slice(0, separator);
}

export function inspectDatasources(environment: RuntimeEnvironment, state: RuntimeState) {
  return environment.listScopes().flatMap(runtime => {
    const data = readScopedPath(state, { scopeId: runtime.scopeId, area: 'data', path: [] }) as Record<string, DataEntry> | undefined;
    return Object.entries(runtime.dataSources.listDefinitions()).map(([id, definition]) => ({
      key: `${runtime.scopeId}:${id}`, scope: runtime.scope, scopeId: runtime.scopeId, id, definition, entry: data?.[id], dependencies: definition.dependsOn ?? [],
    }));
  });
}

export function actionLogEntries(entries: readonly TraceEntry[]) {
  return entries.filter(entry => entry.kind === 'state' ||
    (entry.kind === 'action' && !['state.set', 'state.patch'].includes(entry.metadata?.actionType ?? '')) ||
    (entry.kind === 'error' && entry.metadata?.actionId));
}

export function lifecycleLogEntries(entries: readonly TraceEntry[]) {
  return entries.filter(entry => entry.metadata?.datasourceId && entry.metadata.event);
}

export function formatInspectorValue(value: unknown): string {
  try { return JSON.stringify(value, null, 2) ?? 'undefined'; }
  catch { return '[Unserializable value]'; }
}


/** A projection of live ownership and graph registrations, never a second registry. */
export function inspectScopeHierarchy(environment: RuntimeEnvironment, state: RuntimeState) {
  const registrations = environment.dependencyGraph.registrations();
  const nodes = environment.listScopes().map(scope => ({
    scopeId: scope.scopeId, type: scope.type, definitionId: scope.definition.id,
    parentScopeId: scope.parentScopeId, applicationScopeId: scope.applicationScopeId, viewScopeId: scope.viewScopeId,
    origin: scope.origin, lifetime: scope.origin?.scopeLifetime ?? (scope.type === 'application' ? 'application owner' : 'parent disposal / host unmount'),
    state: readScopedPath(state, { scopeId: scope.scopeId, area: 'state', path: [] }),
    dataSources: Object.entries(scope.dataSources.listDefinitions()).map(([sourceId, definition]) => ({
      sourceId, definition, entry: readScopedPath(state, { scopeId: scope.scopeId, area: 'data', path: [sourceId] }) as DataEntry | undefined,
    })),
    actions: scope.actionDefinitions,
    dependencies: registrations.filter(edge => edge.target.scopeId === scope.scopeId),
    children: [] as ScopeInspection[],
  }));
  const byId = new Map(nodes.map(node => [node.scopeId, node]));
  const roots: ScopeInspection[] = [];
  for (const node of nodes) {
    const parent = node.parentScopeId ? byId.get(node.parentScopeId) : undefined;
    if (parent) parent.children.push(node); else roots.push(node);
  }
  return roots;
}
export type ScopeInspection = {
  scopeId: string; type: RuntimeScope['type']; definitionId: string;
  parentScopeId: string | null; applicationScopeId: string; viewScopeId: string | null;
  origin: RuntimeScope['origin']; lifetime: string; state: unknown;
  dataSources: { sourceId: string; definition: import('../../runtime/shared/types').DataSourceDefinition; entry?: DataEntry }[];
  actions: RuntimeScope['actionDefinitions']; dependencies: readonly DependencyRegistration[]; children: ScopeInspection[];
};
export function schemaLogEntries(entries: readonly TraceEntry[]) {
  return entries.filter(entry => entry.metadata?.schemaResource || entry.metadata?.viewSchema);
}

/** Reconstruct a readable namespace from a registered, canonical scope address. */
export function dependencyExpression(path: ScopedChangedPath, scopeId: string, environment: RuntimeEnvironment) {
  const target = environment.getScope(scopeId);
  const root = path.scopeId === scopeId ? (path.area === 'state' ? '$state' : '$data')
    : path.scopeId === target?.applicationScopeId ? (path.area === 'state' ? '$appState' : '$appData')
    : path.area === 'state' ? '$viewState' : '$viewData';
  return root + (path.path.length ? '.' + path.path.join('.') : '');
}
