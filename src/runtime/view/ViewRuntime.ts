import { RuntimeScope } from "../shared/RuntimeScope";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import type { ViewDefinition } from "./types";
export class ViewRuntime extends RuntimeScope {
  constructor(
    definition: ViewDefinition,
    environment: RuntimeEnvironment,
    parentScope?: RuntimeScope,
  ) {
    super(definition, "view", environment, parentScope);
  }
}
