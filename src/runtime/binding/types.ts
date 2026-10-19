import type { Expression, JsonValue } from "../shared/json";
export interface BindingDefinition {
  source: Expression;
  default?: JsonValue;
}
