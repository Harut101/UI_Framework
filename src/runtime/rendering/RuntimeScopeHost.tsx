import { useLayoutEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RuntimeContext, RuntimeNode } from "./RuntimeNode";
import { readScopedPath } from "../shared/scopeAddress";
import type { ComponentRegistry } from "./ComponentRegistry";
import type { RuntimeScope } from "../shared/RuntimeScope";
import type { ComponentDefinition, RuntimeState } from "../shared/types";

export interface ScopeActivation {
  scope: RuntimeScope;
  root: ComponentDefinition;
}

/** One React lifecycle bridge for views and fragments; no Redux Provider/store here. */
export function RuntimeScopeHost({
  create,
  registry,
  visible = true,
}: {
  create: () => ScopeActivation;
  registry: ComponentRegistry;
  visible?: boolean;
}) {
  const [activation, setActivation] = useState<
    (ScopeActivation & { create: typeof create }) | null
  >(null);
  const [failure, setFailure] = useState<{
    create: typeof create;
    error: unknown;
  } | null>(null);
  useLayoutEffect(() => {
    let next: ScopeActivation | null = null;
    let owned = true;
    // StrictMode cancels its replay generation before it creates a scope or starts requests.
    queueMicrotask(() => {
      if (!owned) return;
      try {
        next = create();
        next.scope.start();
        setActivation({ ...next, create });
      } catch (error) {
        next?.scope.dispose();
        setFailure({ create, error });
      }
    });
    return () => {
      owned = false;
      next?.scope.dispose();
    };
  }, [create]);
  const current = activation?.create === create ? activation : null;
  const ready = useSelector(
    (state: RuntimeState) =>
      current !== null &&
      readScopedPath(state, {
        scopeId: current.scope.scopeId,
        area: "state",
        path: [],
      }) !== undefined,
  );
  const context = useMemo(
    () => (current ? { runtime: current.scope, registry } : null),
    [current, registry],
  );
  if (failure?.create === create) throw failure.error;
  // Hiding a retained owner unmounts its children, while its own scope remains owned here.
  return visible && ready && current && context ? (
    <RuntimeContext.Provider value={context}>
      <RuntimeNode definition={current.root} />
    </RuntimeContext.Provider>
  ) : null;
}
