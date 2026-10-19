import type { ComponentDefinition } from "../rendering/types";
import type { RouteDefinition, ViewSourceDefinition } from "../routing/types";
import type { ScopeDefinition } from "../shared/types";
import type { ViewDefinition } from "../view/types";
export interface ApplicationDefinition extends ScopeDefinition {
  shell: ComponentDefinition;
  viewSource?: ViewSourceDefinition;
  routes: RouteDefinition[];
  views: Record<string, ViewDefinition>;
}
