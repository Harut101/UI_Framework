import type { RuntimeScope } from '../shared/RuntimeScope';
import type { ActionEngine } from "../actions/ActionEngine";
import type { ComponentDefinition, StateObject } from "../shared/types";

export class ComponentBinder {
  bind(definition: ComponentDefinition, engine: ActionEngine, scope: RuntimeScope = engine.scope): StateObject {
    const handlers = Object.fromEntries(
      Object.entries(definition.handlers ?? {}).map(([prop, handler]) => [
        prop,
        (event: unknown) => {
          void engine.execute(handler.action, { event, scope }).catch((error) => {
            const message =
              error instanceof Error ? error.message : String(error);
            engine.services.diagnostics.trace("error", handler.action, message, {
              scope: engine.services.scope, instance: engine.services.instance, actionId: handler.action, event: 'error',
            });
            engine.services.notify(message, "error");
          });
        },
      ]),
    );
    return { ...definition.props, ...handlers };
  }
}

