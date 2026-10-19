import { createContext, useContext } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import type { RouteDefinition } from "./types";
import type { ViewSchemaLoader } from "./ViewSchemaLoader";
import { ViewRuntimeHost } from "../view/ViewRuntimeHost";
export const RouteRuntimeContext = createContext<{
  routes: RouteDefinition[];
  loader: ViewSchemaLoader;
  environment: RuntimeEnvironment;
  registry: ComponentRegistry;
  revision: number;
} | null>(null);
function RoutedView({ viewId }: { viewId: string }) {
  const context = useContext(RouteRuntimeContext)!;
  const { pathname } = useLocation();
  return <ViewRuntimeHost
    key={`${pathname}:${viewId}:${context.revision}`}
    definition={context.loader.load(viewId)}
    environment={context.environment}
    registry={context.registry}
  />;
}

export function RouteOutlet() {
  const context = useContext(RouteRuntimeContext);
  if (!context) throw new Error("RouteOutlet must be inside ApplicationHost");
  if (!context.routes.length) return null;
  return (
    <Routes>
      {context.routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <RoutedView viewId={route.viewId}/>
          }
        />
      ))}
      <Route
        path="*"
        element={<Navigate replace to={context.routes[0].path} />}
      />
    </Routes>
  );
}
export function registerRouteOutlet(registry: ComponentRegistry) {
  return registry.register("route-outlet", RouteOutlet);
}
