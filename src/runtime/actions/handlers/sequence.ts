import type { ActionHandler } from "../ActionRegistry";
export const sequenceActionHandler: ActionHandler<"sequence"> = async (
  definition,
  context,
  engine,
  stack,
) => {
  engine.traceResolved(stack, definition.actions, '(sequence actions)');
  for (const id of definition.actions) await engine.execute(id, context, stack);
};
