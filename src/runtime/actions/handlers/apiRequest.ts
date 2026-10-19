import { assertLocalStateTarget } from './stateTarget';
import { runtimeActions } from "../../redux/runtimeActions";
import type { RequestDefinition } from "../../datasource/types";
import type { ActionHandler } from "../ActionRegistry";
export const apiRequestActionHandler: ActionHandler<"api.request"> = async (
  definition,
  context,
  engine,
  stack,
) => {
  const { services } = engine;
  const { scope } = context;
  if (definition.target !== undefined) assertLocalStateTarget(definition.target);
  let response: unknown;
  try {
    const request = engine.resolve(
      definition.request,
      context,
    ) as RequestDefinition;
    engine.traceResolved(stack, request, '(request)');
    services.diagnostics.trace(
      "request",
      `${request.method} ${request.path}`,
      "action request",
      { scope: scope.scope, instance: scope.scopeId, actionId: stack.at(-1), actionType: definition.type, request, event: 'loading' },
    );
    response = await services.transport(request, scope.signal);
  } catch (error) {
    if (!scope.active() || scope.signal.aborted) return;
    if (definition.onError) {
      context.response = {
        error: error instanceof Error ? error.message : String(error),
      };
      await engine.execute(definition.onError, context, stack);
    } else throw error;
    return;
  }
  if (!scope.active()) return;
  context.response = response;
  if (definition.target) {
    services.store.dispatch(runtimeActions.set({
      scope: scope.scope, instance: scope.scopeId,
      target: definition.target, value: response,
    }));
    engine.traceResolved(stack, response, definition.target);
  }
  // A failed success action is an action failure, not a failed HTTP request.
  if (definition.onSuccess) await engine.execute(definition.onSuccess, context, stack);
};

