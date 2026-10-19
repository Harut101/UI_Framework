import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SchemaFragmentEntry, SchemaFragmentState } from "./types";

export const schemaFragmentSlice = createSlice({
  name: "schemaFragments",
  initialState: {} as SchemaFragmentState,
  reducers: {
    changed(
      state,
      { payload }: PayloadAction<{ id: string; entry: SchemaFragmentEntry }>,
    ) {
      state[payload.id] = payload.entry;
    },
    removed(state, { payload }: PayloadAction<string>) {
      delete state[payload];
    },
  },
});
