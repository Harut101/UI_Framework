import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RuntimeState, ScopedChangedPath } from "../shared/types";
import { getChangedPaths } from "./changedPaths";
export type RuntimeDependencyObserver = (
  changedPaths: readonly ScopedChangedPath[],
  previous: RuntimeState,
  current: RuntimeState,
) => void;
export function createRuntimeListenerMiddleware(
  observer?: RuntimeDependencyObserver,
) {
  const listener = createListenerMiddleware<RuntimeState>();
  listener.startListening({
    predicate: (_action, current, previous) => current !== previous,
    effect: (_action, api) => {
      const previous = api.getOriginalState();
      const current = api.getState();
      const changedPaths = getChangedPaths(previous, current);
      if (changedPaths.length) observer?.(changedPaths, previous, current);
    },
  });
  return listener;
}
