import { createSlice } from "@reduxjs/toolkit";
import { setPath } from "../binding/ExpressionResolver";
import type { StateObject } from "../shared/json";
import { runtimeActions } from "./runtimeActions";
import { patchState } from "./patchState";
export const appStateSlice = createSlice({
  name: "appState",
  initialState: {} as StateObject,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(runtimeActions.disposeScope, (state, { payload }) =>
        payload.scope === "app" ? {} : state,
      )
      .addCase(runtimeActions.initialize, (state, { payload }) =>
        payload.scope === "app" ? payload.initialState : state,
      )
      .addCase(runtimeActions.set, (state, { payload }) => {
        if (payload.scope === "app")
          setPath(state, payload.target, payload.value);
      })
      .addCase(runtimeActions.patch, (state, { payload }) =>
        payload.scope === "app" ? patchState(state, payload) : state,
      ),
});
