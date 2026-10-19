import viewJson from "./views/hello-runtime.json";
import applicationJson from "./application/playground.json";
import { createComponentRegistry } from "../components/registry";
import { registerRouteOutlet } from "../runtime/routing/RouteOutlet";
import {
  validateApplicationDefinition,
  validateViewDefinition,
} from "../runtime/shared/validation";
import type { ApplicationDefinition } from "../runtime/application/types";
const registry = registerRouteOutlet(createComponentRegistry());
const view: unknown = viewJson;
validateViewDefinition(view, registry);
export const helloViewDefinition = view;
export const applicationDefinition: ApplicationDefinition = {
  ...applicationJson,
  views: { [view.id]: view },
};
validateApplicationDefinition(applicationDefinition, registry);
