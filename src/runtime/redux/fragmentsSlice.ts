import { createSlice } from '@reduxjs/toolkit';
import { runtimeActions } from './runtimeActions';
import { setPath } from '../binding/ExpressionResolver';
import { patchState } from './patchState';
import type { RuntimeState } from '../shared/types';

export const fragmentsSlice = createSlice({
  name: 'fragments',
  initialState: {} as RuntimeState['fragments'],
  reducers: {},
  extraReducers: builder => builder
    .addCase(runtimeActions.initialize, (state, { payload }) => {
      if (payload.scope === 'fragment' && !Object.hasOwn(state, payload.instance))
        state[payload.instance] = { state: payload.initialState, data: payload.data };
    })
    .addCase(runtimeActions.disposeScope, (state, { payload }) => {
      if (payload.scope === 'fragment') delete state[payload.instance];
    })
    .addCase(runtimeActions.set, (state, { payload }) => {
      if (payload.scope === 'fragment' && Object.hasOwn(state, payload.instance))
        setPath(state[payload.instance].state, payload.target, payload.value);
    })
    .addCase(runtimeActions.patch, (state, { payload }) => {
      if (payload.scope === 'fragment' && Object.hasOwn(state, payload.instance))
        state[payload.instance].state = patchState(state[payload.instance].state, payload);
    })
    .addCase(runtimeActions.dataChanged, (state, { payload }) => {
      if (payload.scope === 'fragment' && Object.hasOwn(state, payload.instance))
        state[payload.instance].data[payload.id] = payload.entry;
    }),
});
