import { ActionRegistry } from "./ActionRegistry";
import { stateSetActionHandler } from "./handlers/stateSet";
import { statePatchActionHandler } from "./handlers/statePatch";
import {
  datasourceReloadActionHandler,
  datasourceInvalidateActionHandler,
} from "./handlers/datasource";
import { navigateActionHandler } from "./handlers/navigate";
import { notificationActionHandler } from "./handlers/notification";
import { sequenceActionHandler } from "./handlers/sequence";
import { apiRequestActionHandler } from "./handlers/apiRequest";
export function createActionRegistry() {
  return new ActionRegistry()
    .register("state.set", stateSetActionHandler)
    .register("state.patch", statePatchActionHandler)
    .register("datasource.reload", datasourceReloadActionHandler)
    .register("datasource.invalidate", datasourceInvalidateActionHandler)
    .register("navigate", navigateActionHandler)
    .register("notification.show", notificationActionHandler)
    .register("sequence", sequenceActionHandler)
    .register("api.request", apiRequestActionHandler);
}
