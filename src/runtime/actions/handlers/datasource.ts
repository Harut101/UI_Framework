import type { ActionHandler } from "../ActionRegistry";
export const datasourceReloadActionHandler: ActionHandler<
  "datasource.reload"
> = (definition, context, engine, stack) => {
  engine.traceResolved(stack, definition.source, "(datasource)");
  return context.scope.dataSources.reload(definition.source);
};
export const datasourceInvalidateActionHandler: ActionHandler<
  "datasource.invalidate"
> = (definition, context, engine, stack) => {
  engine.traceResolved(stack, definition.source, "(datasource)");
  return context.scope.dataSources.invalidate(definition.source);
};
