export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
export type StateObject = Record<string, unknown>;
export type RuntimeScopeType = 'application' | 'view' | 'fragment';
export type ScopeId = string;
export interface ScopedChangedPath {
  readonly scopeId: ScopeId;
  readonly area: 'state' | 'data';
  readonly path: readonly string[];
}
export interface ScopeAddressContext {
  readonly scopeId: ScopeId;
  readonly applicationScopeId: ScopeId;
  readonly viewScopeId: ScopeId | null;
}
/** Legacy action/diagnostic spelling for application remains app. */
export type Scope = 'app' | 'view' | 'fragment';
export type StateExpressionRoot = '$appState' | '$appData' | '$viewState' | '$viewData' | '$state' | '$data';
export type StateExpression = StateExpressionRoot | `${StateExpressionRoot}.${string}`;
export type ExpressionRoot = StateExpressionRoot | '$event' | '$response';
export type Expression = ExpressionRoot | `${ExpressionRoot}.${string}`;
export interface TraceMetadata {
  viewSchema?: { pathname: string };
  scope?: Scope;
  instance?: string;
  actionId?: string;
  actionType?: string;
  target?: string;
  value?: unknown;
  datasourceId?: string;
  request?: import('../datasource/types').RequestDefinition;
  schemaResource?: { id: string; source: string; key: import('../schema/types').FragmentKey; cache: import('../schema/types').DefinitionCachePolicy; owner: string };
  event?: 'execute' | 'resolved' | 'stateChanged' | 'dependencyChanged' | 'debounced' | 'loading' | 'success' | 'error' | 'cancelled' | 'invalidated' | 'cacheHit';
  changedPaths?: readonly StateExpression[];
  scopedChangedPaths?: readonly ScopedChangedPath[];
  resource?: { scopeId: ScopeId; sourceId: string };
  debounceMs?: number;
}
export interface TraceEntry {
  id: number;
  time: string;
  kind: 'action' | 'state' | 'dependency' | 'request' | 'lifecycle' | 'error';
  label: string;
  detail?: string;
  metadata?: Readonly<TraceMetadata>;
}

