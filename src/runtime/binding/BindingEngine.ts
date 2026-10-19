import type {
  ComponentDefinition,
  RuntimeState,
  StateObject,
} from "../shared/types";
import type { ExpressionResolver } from "./ExpressionResolver";
import type { RuntimeScope } from "../shared/RuntimeScope";

type ReactiveDefinition = Pick<ComponentDefinition, "bindings" | "visibility">;

export class BindingEngine {
  constructor(private readonly resolver: ExpressionResolver) {}

  /** Create once per node/scope. Defaults stay literal, with stable references. */
  createSelector(
    bindings: ComponentDefinition["bindings"],
    scope: RuntimeScope,
    visibility?: ComponentDefinition["visibility"],
  ): (state: RuntimeState) => StateObject {
    const definition = { bindings, visibility };
    let previous: StateObject | undefined;
    return (state) => {
      const next = this.evaluate(definition, state, scope);
      const keys = Object.keys(next);
      if (
        previous &&
        keys.length === Object.keys(previous).length &&
        keys.every((key) => Object.is(next[key], previous![key]))
      )
        return previous;
      previous = next;
      return next;
    };
  }

  /** Compatibility projection for callers without a live scope. */
  select(
    definition: ComponentDefinition,
    state: RuntimeState,
    scope?: RuntimeScope,
  ): StateObject {
    return this.evaluate(definition, state, scope);
  }

  private evaluate(
    definition: ReactiveDefinition,
    state: RuntimeState,
    scope?: RuntimeScope,
  ): StateObject {
    const context = { state, scope };
    const props: StateObject = {};
    for (const [prop, binding] of Object.entries(definition.bindings ?? {})) {
      const source = typeof binding === "string" ? binding : binding.source;
      const value = this.resolver.resolve(source, context);
      props[prop] =
        value ?? (typeof binding === "string" ? undefined : binding.default);
    }
    return {
      ...props,
      __visible:
        definition.visibility === undefined
          ? true
          : Boolean(this.resolver.resolve(definition.visibility, context)),
    };
  }
}
