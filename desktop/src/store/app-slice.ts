import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {Workspace} from "@/types/workspaces";
import {Node} from "@/types/nodes";
import {Account} from "@/types/accounts";

export interface AppState {
  loaded: boolean;
  accounts: Account[];
  workspaces: Workspace[];
  nodes: Record<string, Node>;
}

const initialState: AppState = {
  loaded: false,
  accounts: [],
  workspaces: [],
  nodes: {}
}

export const appSlice = createSlice({
  name: 'app',
  initialState: initialState,
  reducers: {
    setLoaded: (state) => {
      state.loaded = true
    },
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces = [...state.workspaces, action.payload]
    },
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload.reduce((acc, node) => {
        acc[node.id] = node
        return acc
      }, {} as Record<string, Node>)
    },
    setNode: (state, action: PayloadAction<Node>) => {
      state.nodes[action.payload.id] = action.payload
    },
    removeNode: (state, action: PayloadAction<string>) => {
      delete state.nodes[action.payload]
    },
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts = [...state.accounts, action.payload]
    }
  },
})

export const { setLoaded, setWorkspaces, addWorkspace, setNode, setNodes, removeNode, setAccounts, addAccount } = appSlice.actions
export const appReducer = appSlice.reducer

