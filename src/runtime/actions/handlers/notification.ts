import type { ActionHandler } from "../ActionRegistry";
export const notificationActionHandler: ActionHandler<"notification.show"> = (
  definition,
  context,
  engine,
  stack,
) => {
  const message = String(engine.resolve(definition.message, context) ?? "");
  engine.traceResolved(stack, message, "(notification)");
  engine.services.notify(message, definition.tone ?? "info");
};
