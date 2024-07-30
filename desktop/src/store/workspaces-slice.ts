import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {Workspace} from "@/types/workspaces";

export interface WorkspacesState {
  loaded: boolean;
  workspaces: Workspace[];
}

const initialState: WorkspacesState = {
  loaded: false,
  workspaces: [],
}

export const workspacesSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload
      state.loaded = true
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload)
    }
  },
})

export const { setWorkspaces, addWorkspace } = workspacesSlice.actions
export const workspacesReducer = workspacesSlice.reducer

