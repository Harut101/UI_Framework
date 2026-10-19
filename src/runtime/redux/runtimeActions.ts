import { createAction } from "@reduxjs/toolkit";
import type { DataEntry, Scope, StateObject } from "../shared/types";
export interface StateUpdate {
  scope: Scope;
  instance: string;
  target: string;
  value: unknown;
}
export interface StatePatch {
  scope: Scope;
  instance: string;
  target?: string;
  value: StateObject;
}
export const runtimeActions = {
  initialize: createAction<{
    scope: Scope;
    instance: string;
    initialState: StateObject;
    data: Record<string, DataEntry>;
  }>("runtime/initialize"),
  disposeScope: createAction<{ scope: Scope; instance: string }>(
    "runtime/disposeScope",
  ),
  disposeView: createAction<string>("runtime/disposeView"),
  set: createAction<StateUpdate>("runtime/set"),
  patch: createAction<StatePatch>("runtime/patch"),
  dataChanged: createAction<{
    scope: Scope;
    instance: string;
    id: string;
    entry: DataEntry;
  }>("runtime/dataChanged"),
};
