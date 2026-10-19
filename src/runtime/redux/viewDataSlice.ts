import { createSlice } from "@reduxjs/toolkit";
import type { DataEntry } from "../datasource/types";
import { runtimeActions } from "./runtimeActions";
export const viewDataSlice = createSlice({
  name: "viewData",
  initialState: {} as Record<string, DataEntry>,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(runtimeActions.initialize, (state, { payload }) =>
        payload.scope === "view" ? payload.data : state,
      )
      .addCase(runtimeActions.disposeScope, (state, { payload }) =>
        payload.scope === "view" ? {} : state,
      )
      .addCase(runtimeActions.dataChanged, (state, { payload }) => {
        if (payload.scope === "view") state[payload.id] = payload.entry;
      }),
});
