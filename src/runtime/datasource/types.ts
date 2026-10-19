import type {
  StateExpression,
  JsonObject,
  JsonValue,
  ScopeId,
  ScopedChangedPath,
} from "../shared/json";
export interface DataSourceIdentity {
  readonly scopeId: ScopeId;
  readonly sourceId: string;
}
export interface DependencyRegistration {
  readonly target: DataSourceIdentity;
  readonly paths: readonly ScopedChangedPath[];
}
export interface RequestDefinition {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  params?: JsonObject;
  query?: JsonObject;
  body?: JsonValue;
}
export interface DataSourceDefinition {
  type: "api";
  request: RequestDefinition;
  dependsOn?: StateExpression[];
  load: {
    strategy: "onViewInit" | "onAppInit" | "onScopeInit" | "manual";
    reload?: "onDependencyChange" | "manual";
    debounceMs?: number;
  };
}
export interface DataEntry {
  status: "idle" | "loading" | "success" | "error";
  loading: boolean;
  data: unknown;
  error: string | null;
}
