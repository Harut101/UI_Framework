import type { ActionHandler } from "../ActionRegistry";
export const navigateActionHandler: ActionHandler<"navigate"> = (
  definition,
  context,
  engine,
  stack,
) => {
  const to = engine.resolve(definition.to, context);
  if (typeof to !== "string")
    throw new Error("navigate.to must resolve to a string");
  engine.traceResolved(stack, to, '(navigation)');
  engine.services.navigate(to);
};
