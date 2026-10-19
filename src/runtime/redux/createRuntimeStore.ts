import {
  combineReducers,
  configureStore,
  createReducer,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { schemaFragmentSlice } from "../schema/schemaFragmentSlice";
import { appStateSlice } from "./appStateSlice";
import { appDataSlice } from "./appDataSlice";
import { viewStateSlice } from "./viewStateSlice";
import { viewDataSlice } from "./viewDataSlice";
import { fragmentsSlice } from "./fragmentsSlice";
import { runtimeActions } from "./runtimeActions";
import {
  createRuntimeListenerMiddleware,
  type RuntimeDependencyObserver,
} from "./listenerMiddleware";
import type { RuntimeState, Scope } from "../shared/types";

function instanceReducer(scope: "app" | "view") {
  return createReducer<string | null>(null, (builder) =>
    builder
      .addCase(runtimeActions.initialize, (state, { payload }) =>
        payload.scope === scope ? payload.instance : state,
      )
      .addCase(runtimeActions.disposeScope, (state, { payload }) =>
        payload.scope === scope ? null : state,
      ),
  );
}
const namespaceReducer = combineReducers({
  schemaFragments: schemaFragmentSlice.reducer,
  appState: appStateSlice.reducer,
  appData: appDataSlice.reducer,
  viewState: viewStateSlice.reducer,
  viewData: viewDataSlice.reducer,
  fragments: fragmentsSlice.reducer,
  applicationInstance: instanceReducer("app"),
  viewInstance: instanceReducer("view"),
});
function activeAddress(state: RuntimeState, scope: Scope, instance: string) {
  if (scope === "app") return state.applicationInstance === instance;
  if (scope === "view") return state.viewInstance === instance;
  return Object.hasOwn(state.fragments, instance);
}
function reducer(
  state: RuntimeState | undefined,
  original: UnknownAction,
): RuntimeState {
  // Old view-disposal callers share the same generic cleanup path.
  const action = runtimeActions.disposeView.match(original)
    ? runtimeActions.disposeScope({ scope: "view", instance: original.payload })
    : original;
  if (runtimeActions.initialize.match(action)) {
    const id = action.payload.instance;
    if (!id || ["__proto__", "prototype", "constructor"].includes(id))
      throw new Error("Invalid scope identity");
    if (state && activeAddress(state, action.payload.scope, id)) return state;
  }
  if (
    state &&
    (runtimeActions.disposeScope.match(action) ||
      runtimeActions.set.match(action) ||
      runtimeActions.patch.match(action) ||
      runtimeActions.dataChanged.match(action))
  ) {
    if (!activeAddress(state, action.payload.scope, action.payload.instance))
      return state;
  }
  return namespaceReducer(state, action);
}
export function createRuntimeStore(observer?: RuntimeDependencyObserver) {
  const listener = createRuntimeListenerMiddleware(observer);
  const store = configureStore({
    reducer,
    middleware: (defaults) => defaults().prepend(listener.middleware),
  });
  return { store, listener };
}
export type RuntimeStore = ReturnType<typeof createRuntimeStore>["store"];
