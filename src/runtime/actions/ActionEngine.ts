import type { ActionRegistry } from "./ActionRegistry";
import type { ActionServices } from "./ActionServices";
import type { ExecutionContext, ScopedExecutionContext } from "./types";

/** A scope owns named actions; the shared registry owns generic action types. */
export class ActionEngine {
  constructor(
    readonly services: ActionServices,
    private readonly registry: ActionRegistry,
  ) {}

  get scope() {
    return this.services.runtimeScope;
  }
  get definitions() {
    return this.scope.actionDefinitions;
  }

  private executionScope(context: ExecutionContext) {
    const scope = context.scope ?? this.scope;
    if (scope !== this.scope)
      throw new Error("Cross-scope action execution is not supported");
    return scope;
  }

  resolve(value: unknown, context: ExecutionContext) {
    return this.services.resolver.resolve(value, {
      state: this.services.store.getState(),
      scope: this.executionScope(context),
      event: context.event,
      response: context.response,
    });
  }

  /** Handlers report values they already resolved; tooling never evaluates actions again. */
  traceResolved(
    stack: readonly string[],
    value: unknown,
    target = "(no state target)",
  ) {
    const id = stack.at(-1);
    if (!id) return;
    const definition = this.definitions[id];
    this.services.diagnostics.trace("action", id, definition.type, {
      scope: this.scope.scope,
      instance: this.scope.scopeId,
      actionId: id,
      actionType: definition.type,
      event: "resolved",
      target,
      value,
    });
  }

  async execute(
    id: string,
    context: ExecutionContext = {},
    stack: string[] = [],
  ): Promise<void> {
    const scope = this.executionScope(context);
    if (!scope.active()) return;
    // Copy root context so concurrent calls cannot overwrite each other's response.
    // Nested named calls share that chain's response and immutable scope identity.
    const execution: ScopedExecutionContext =
      stack.length && context.scope === scope
        ? (context as ScopedExecutionContext)
        : { scope, event: context.event, response: context.response };
    if (stack.includes(id))
      throw new Error(
        `Circular action sequence: ${[...stack, id].join(" → ")}`,
      );
    const definition = Object.hasOwn(scope.actionDefinitions, id)
      ? scope.actionDefinitions[id]
      : undefined;
    if (!definition) throw new Error(`Unknown named action: ${id}`);
    this.services.diagnostics.trace("action", id, definition.type, {
      scope: scope.scope,
      instance: scope.scopeId,
      actionId: id,
      actionType: definition.type,
      event: "execute",
      target: "target" in definition ? definition.target : undefined,
    });
    await this.registry.get(definition.type)(definition, execution, this, [
      ...stack,
      id,
    ]);
  }
}
