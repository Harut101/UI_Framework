import { RuntimeScope } from "../shared/RuntimeScope";
import type { RuntimeEnvironment } from "../shared/RuntimeEnvironment";
import type { ApplicationDefinition } from "./types";
export class ApplicationRuntime extends RuntimeScope {
  constructor(
    definition: ApplicationDefinition,
    environment: RuntimeEnvironment,
  ) {
    super(definition, "application", environment);
  }
}
