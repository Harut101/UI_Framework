import type { ComponentDefinition } from "../rendering/types";
import type { ScopeDefinition } from "../shared/types";
export interface ViewDefinition extends ScopeDefinition {
  title: string;
  root: ComponentDefinition;
}
