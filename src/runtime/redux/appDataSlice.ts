import { createSlice } from "@reduxjs/toolkit";
import type { DataEntry } from "../datasource/types";
import { runtimeActions } from "./runtimeActions";
export const appDataSlice = createSlice({
  name: "appData",
  initialState: {} as Record<string, DataEntry>,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(runtimeActions.disposeScope, (state, { payload }) =>
        payload.scope === "app" ? {} : state,
      )
      .addCase(runtimeActions.initialize, (state, { payload }) =>
        payload.scope === "app" ? payload.data : state,
      )
      .addCase(runtimeActions.dataChanged, (state, { payload }) => {
        if (payload.scope === "app") state[payload.id] = payload.entry;
      }),
});
