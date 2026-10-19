import { createSlice } from "@reduxjs/toolkit";
import { setPath } from "../binding/ExpressionResolver";
import type { StateObject } from "../shared/json";
import { runtimeActions } from "./runtimeActions";
import { patchState } from "./patchState";
export const viewStateSlice = createSlice({
  name: "viewState",
  initialState: {} as StateObject,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(runtimeActions.initialize, (state, { payload }) =>
        payload.scope === "view" ? payload.initialState : state,
      )
      .addCase(runtimeActions.disposeScope, (state, { payload }) =>
        payload.scope === "view" ? {} : state,
      )
      .addCase(runtimeActions.set, (state, { payload }) => {
        if (payload.scope === "view")
          setPath(state, payload.target, payload.value);
      })
      .addCase(runtimeActions.patch, (state, { payload }) =>
        payload.scope === "view" ? patchState(state, payload) : state,
      ),
});
