import type { BindingDefinition } from "../binding/types";
import type { Expression, JsonObject } from "../shared/json";
export interface HandlerDefinition {
  action: string;
}
export interface ComponentDefinition {
  id: string;
  type: string;
  props?: JsonObject;
  bindings?: Record<string, Expression | BindingDefinition>;
  visibility?: Expression | boolean;
  handlers?: Record<string, HandlerDefinition>;
  children?: ComponentDefinition[];
  /** Infrastructure configuration, consumed only by registered schema-outlet. */
  source?: import("../schema/types").SchemaSource;
  lifecycle?: {
    scopeLifetime?: import("../schema/types").FragmentScopeLifetime;
  };
  enabled?: Expression | boolean;
  key?: import("../shared/json").JsonValue;
  loading?: ComponentDefinition;
  error?: ComponentDefinition;
}
