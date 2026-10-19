import { assertLocalStateTarget } from "./stateTarget";
import { runtimeActions } from "../../redux/runtimeActions";
import { diagnosticDetail } from "../../shared/Diagnostics";
import type { ActionHandler } from "../ActionRegistry";
export const stateSetActionHandler: ActionHandler<"state.set"> = (
  definition,
  context,
  engine,
  stack,
) => {
  const { services } = engine;
  const { scope } = context;
  assertLocalStateTarget(definition.target);
  const value = engine.resolve(definition.value, context);
  services.store.dispatch(
    runtimeActions.set({
      scope: scope.scope,
      instance: scope.scopeId,
      target: definition.target,
      value,
    }),
  );
  services.diagnostics.trace(
    "state",
    definition.target,
    diagnosticDetail(value),
    {
      scope: scope.scope,
      instance: scope.scopeId,
      actionId: stack.at(-1),
      actionType: definition.type,
      target: definition.target,
      value,
      event: "stateChanged",
    },
  );
};
