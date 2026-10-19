import { memo, useMemo } from "react";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import { RuntimeContext, RuntimeNode } from "../rendering/RuntimeNode";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import { RouteRuntimeContext } from "../routing/RouteOutlet";
import { ViewSchemaLoader } from "../routing/ViewSchemaLoader";
import type { ViewDefinition } from "../view/types";
import type { ApplicationDefinition } from "./types";
import type { ApplicationRuntime } from "./ApplicationRuntime";
export const ApplicationHost = memo(function ApplicationHost({
  definition,
  views,
  environment,
  runtime,
  registry,
  revision = 0,
}: {
  definition: ApplicationDefinition;
  views: Record<string, ViewDefinition>;
  environment: RuntimeEnvironment;
  runtime: ApplicationRuntime;
  registry: ComponentRegistry;
  revision?: number;
}) {
  const loader = useMemo(() => new ViewSchemaLoader(views), [views]);
  const routeContext = useMemo(
    () => ({
      routes: definition.routes,
      loader,
      environment,
      registry,
      revision,
    }),
    [definition, loader, environment, registry, revision],
  );
  const context = useMemo(() => ({ runtime, registry }), [runtime, registry]);
  return (
    <RouteRuntimeContext.Provider value={routeContext}>
      <RuntimeContext.Provider value={context}>
        <RuntimeNode definition={definition.shell} />
      </RuntimeContext.Provider>
    </RouteRuntimeContext.Provider>
  );
});
