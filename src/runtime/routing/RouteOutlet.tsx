import { useSelector } from "react-redux";
import type { RuntimeState, RequestDefinition } from "../shared/types";
import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import type { RuntimeScope } from "../shared/RuntimeScope";
import type { RouteDefinition, ViewSourceDefinition } from "./types";
import type { ViewSchemaLoader } from "./ViewSchemaLoader";
import type { ViewDefinition } from "../view/types";
import { FragmentRenderBoundary } from "../schema/FragmentRenderBoundary";
import { ViewRuntimeHost } from "../view/ViewRuntimeHost";

export const RouteRuntimeContext = createContext<{
  routes: RouteDefinition[];
  viewSource?: ViewSourceDefinition;
  runtime: RuntimeScope;
  loader: ViewSchemaLoader;
  environment: RuntimeEnvironment;
  registry: ComponentRegistry;
  revision: number;
} | null>(null);

function RoutedView({ viewId }: { viewId: string }) {
  const context = useContext(RouteRuntimeContext)!;
  const { pathname } = useLocation();
  return (
    <ViewRuntimeHost
      key={[pathname, viewId, context.revision].join(":")}
      definition={context.loader.load(viewId)}
      environment={context.environment}
      registry={context.registry}
    />
  );
}
function RemoteView({ source }: { source: ViewSourceDefinition }) {
  const context = useContext(RouteRuntimeContext)!;
  const { pathname } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    identity: string;
    definition?: ViewDefinition;
    error?: string;
  } | null>(null);
  const { runtime, loader, environment, registry, revision } = context;
  const prepared = useSelector(
    (state: RuntimeState): { request?: RequestDefinition; error?: string } => {
      try { return { request: loader.prepare(pathname, source, runtime, state) }; }
      catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
    },
    (left, right) => JSON.stringify(left) === JSON.stringify(right),
  );
  const identity = JSON.stringify([
    runtime.scopeId,
    pathname,
    source,
    revision,
    attempt,
    prepared,
  ]);
  useEffect(() => {
    let owned = true;
    let release: (() => void) | undefined;
    try {
      if (prepared.error || !prepared.request) throw new Error(prepared.error ?? "Unresolved view request");
      const lease = loader.acquire(
        pathname,
        source,
        runtime,
        registry,
        attempt,
        prepared.request,
      );
      release = lease.release;
      void lease.promise.then(
        (definition) => {
          if (owned && runtime.active()) {
            if (source.onLoaded)
              void runtime.actionEngine
                .execute(source.onLoaded, {
                  scope: runtime,
                  event: {
                    pathname,
                    viewId: definition.id,
                    title: definition.title,
                  },
                })
                .catch((error) =>
                  environment.diagnostics.trace(
                    "error",
                    "View loaded action failed",
                    String(error),
                    { viewSchema: { pathname } },
                  ),
                );
            setResult({ identity, definition });
          }
        },
        (error) => {
          if (owned && runtime.active())
            setResult({
              identity,
              error: error instanceof Error ? error.message : String(error),
            });
        },
      );
    } catch (error) {
      setResult({
        identity,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return () => {
      owned = false;
      release?.();
    };
  }, [loader, pathname, source, runtime, registry, identity, attempt, prepared]);
  const current = result?.identity === identity ? result : null;
  const ErrorUI = registry.get("error-message");
  const retry = () => setAttempt((value) => value + 1);
  if (current?.error)
    return (
      <ErrorUI text={"Unable to load view: " + current.error} onRetry={retry} />
    );
  if (!current?.definition) {
    const Spinner = registry.get("spinner");
    return <Spinner label="Loading view schema…" />;
  }
  return (
    <FragmentRenderBoundary
      key={identity}
      resetToken={current.definition}
      fallback={<ErrorUI text="Unable to render view" onRetry={retry} />}
      onError={(error) =>
        environment.diagnostics.trace(
          "error",
          "View rendering failed",
          error.message,
          { viewSchema: { pathname } },
        )
      }
    >
      <ViewRuntimeHost
        definition={current.definition}
        environment={environment}
        registry={registry}
      />
    </FragmentRenderBoundary>
  );
}
export function RouteOutlet() {
  const context = useContext(RouteRuntimeContext);
  if (!context) throw new Error("RouteOutlet must be inside ApplicationHost");
  if (context.viewSource) return <RemoteView source={context.viewSource} />;
  if (!context.routes.length) return null;
  return (
    <Routes>
      {context.routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<RoutedView viewId={route.viewId} />}
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
