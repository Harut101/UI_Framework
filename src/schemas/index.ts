import viewJson from "./views/hello-runtime.json";
import applicationJson from "./application/playground.json";
import { createComponentRegistry } from "../components/registry";
import { registerRouteOutlet } from "../runtime/routing/RouteOutlet";
import {
  validateApplicationDefinition,
  validateViewDefinition,
} from "../runtime/shared/validation";
const registry = registerRouteOutlet(createComponentRegistry());
const view: unknown = viewJson;
validateViewDefinition(view, registry);
export const helloViewDefinition = view;
const application: unknown = applicationJson;
validateApplicationDefinition(application, registry);
export const applicationDefinition = application;
