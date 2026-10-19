import type { ComponentDefinition } from "../rendering/types";
import type { ViewSourceDefinition } from "../routing/types";
import type { ScopeDefinition } from "../shared/types";
export interface ApplicationDefinition extends ScopeDefinition {
  shell: ComponentDefinition;
  viewSource: ViewSourceDefinition;
}
