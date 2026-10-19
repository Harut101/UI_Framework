import { assertLocalStateTarget } from './stateTarget';
import { runtimeActions } from "../../redux/runtimeActions";
import type { StateObject } from "../../shared/json";
import type { ActionHandler } from "../ActionRegistry";
export const statePatchActionHandler: ActionHandler<"state.patch"> = (
  definition,
  context,
  engine,
  stack,
) => {
  const { services } = engine;
  const { scope } = context;
  if (definition.target !== undefined) assertLocalStateTarget(definition.target);
  const value = engine.resolve(definition.value, context) as StateObject;
  services.store.dispatch(
    runtimeActions.patch({
      scope: scope.scope,
      instance: scope.scopeId,
      target: definition.target,
      value,
    }),
  );
  services.diagnostics.trace(
    "state",
    definition.target ?? scope.scope,
    "patch",
    { scope: scope.scope, instance: scope.scopeId, actionId: stack.at(-1), actionType: definition.type, target: definition.target ?? '(state root)', value, event: 'stateChanged' },
  );
};

