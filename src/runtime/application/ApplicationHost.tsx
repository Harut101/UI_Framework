import { memo, useMemo } from "react";
import type { ComponentRegistry } from "../rendering/ComponentRegistry";
import { RuntimeContext, RuntimeNode } from "../rendering/RuntimeNode";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import { RouteRuntimeContext } from "../routing/RouteOutlet";
import { ViewSchemaLoader } from "../routing/ViewSchemaLoader";
import type { ApplicationDefinition } from "./types";
import type { ApplicationRuntime } from "./ApplicationRuntime";
export const ApplicationHost = memo(function ApplicationHost({
  definition,
  environment,
  runtime,
  registry,
  revision = 0,
}: {
  definition: ApplicationDefinition;
  environment: RuntimeEnvironment;
  runtime: ApplicationRuntime;
  registry: ComponentRegistry;
  revision?: number;
}) {
  const loader = useMemo(() => new ViewSchemaLoader(), []);
  const routeContext = useMemo(
    () => ({
      viewSource: definition.viewSource,
      runtime,
      loader,
      environment,
      registry,
      revision,
    }),
    [definition, loader, environment, registry, revision, runtime],
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
