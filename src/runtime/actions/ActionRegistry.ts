import type { ActionEngine } from "./ActionEngine";
import type { ActionDefinition, ScopedExecutionContext } from "./types";
export type ActionType = ActionDefinition["type"];
export type ActionHandler<K extends ActionType> = (
  definition: Extract<ActionDefinition, { type: K }>,
  context: ScopedExecutionContext,
  engine: ActionEngine,
  stack: string[],
) => void | Promise<void>;
export class ActionRegistry {
  private readonly handlers = new Map<ActionType, ActionHandler<ActionType>>();
  register<K extends ActionType>(type: K, handler: ActionHandler<K>) {
    this.handlers.set(type, (definition, context, engine, stack) => {
      if (definition.type !== type)
        throw new Error(`Action registry type mismatch: ${type}`);
      return handler(
        definition as Extract<ActionDefinition, { type: K }>,
        context,
        engine,
        stack,
      );
    });
    return this;
  }
  get(type: ActionType) {
    const handler = this.handlers.get(type);
    if (!handler) throw new Error(`Unregistered action type: ${type}`);
    return handler;
  }
}
