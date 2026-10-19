import type { RuntimeScope } from "../shared/RuntimeScope";
import type { RequestDefinition } from "../datasource/types";
import type { JsonObject, JsonValue } from "../shared/json";
export type ActionDefinition =
  | { type: "state.set"; target: string; value: JsonValue }
  | { type: "state.patch"; target?: string; value: JsonObject }
  | {
      type: "api.request";
      request: RequestDefinition;
      target?: string;
      onSuccess?: string;
      onError?: string;
    }
  | { type: "datasource.reload"; source: string }
  | { type: "datasource.invalidate"; source: string }
  | { type: "navigate"; to: string }
  | {
      type: "notification.show";
      message: string;
      tone?: "success" | "error" | "info";
    }
  | { type: "sequence"; actions: string[] };
export interface ExecutionContext {
  /** Omission uses this engine's owning scope for existing callers. */
  readonly scope?: RuntimeScope;
  event?: unknown;
  response?: unknown;
}

/** Generic handlers always receive an explicit, scope-bound execution context. */
export interface ScopedExecutionContext extends ExecutionContext {
  readonly scope: RuntimeScope;
}
