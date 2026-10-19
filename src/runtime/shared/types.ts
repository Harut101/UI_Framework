export type {
  FragmentDefinition,
  NormalizedFragmentDefinition,
  LoadedSchemaDefinition,
} from "../fragment/types";
import type { ActionDefinition } from "../actions/types";
import type { DataEntry, DataSourceDefinition } from "../datasource/types";
import type { JsonObject, StateObject } from "./json";
export type {
  Expression,
  StateExpression,
  StateExpressionRoot,
  JsonValue,
  JsonObject,
  Scope,
  RuntimeScopeType,
  ScopeId,
  ScopedChangedPath,
  ScopeAddressContext,
  StateObject,
  TraceEntry,
  TraceMetadata,
} from "./json";
export type { BindingDefinition } from "../binding/types";
export type {
  ComponentDefinition,
  HandlerDefinition,
} from "../rendering/types";
export type { ActionDefinition } from "../actions/types";
export type {
  RequestDefinition,
  DataEntry,
  DataSourceDefinition,
  DataSourceIdentity,
  DependencyRegistration,
} from "../datasource/types";
export type { ApplicationDefinition } from "../application/types";
export type { ViewDefinition } from "../view/types";
export type { RouteDefinition } from "../routing/types";

export type { SchemaSourceDefinition } from "../schema/types";
export interface RuntimeScopeDefinition {
  schemaSources?: Record<
    string,
    import("../schema/types").SchemaSourceDefinition
  >;
  id: string;
  initialState: JsonObject;
  dataSources: Record<string, DataSourceDefinition>;
  actions: Record<string, ActionDefinition>;
}
/** Compatibility name for existing application/view definitions. */
export type ScopeDefinition = RuntimeScopeDefinition;
/** Observational activation metadata. Never used for ownership decisions or cached JSON. */
export interface ScopeOrigin {
  readonly definitionCache: import("../schema/types").DefinitionCachePolicy;
  readonly scopeLifetime: import("../schema/types").FragmentScopeLifetime;
  readonly cacheOwner: string;
  readonly source: string;
  readonly key: import("../schema/types").FragmentKey;
  readonly requestPath: string;
}
export interface RuntimeState {
  fragments: Record<
    string,
    { state: StateObject; data: Record<string, DataEntry> }
  >;
  /** Internal application identity, mirroring the existing view guard. */
  applicationInstance: string | null;
  schemaFragments: import("../schema/types").SchemaFragmentState;
  appState: StateObject;
  appData: Record<string, DataEntry>;
  viewState: StateObject;
  viewData: Record<string, DataEntry>;
  viewInstance: string | null;
}
export interface ExpressionContext {
  state: RuntimeState;
  /** Read roots from this scope's addresses in the supplied Redux snapshot. */
  scope?: import("./RuntimeScope").RuntimeScope;
  /** @deprecated Fragment-only address retained for Task 2 callers. Prefer scope. */
  scopeId?: string;
  event?: unknown;
  response?: unknown;
}
