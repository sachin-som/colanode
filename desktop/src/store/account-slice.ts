import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {readAccount} from "@/lib/storage";

export interface AccountState {
  token: string | null;
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export const accountSlice = createSlice({
  name: 'account',
  initialState: readAccount(),
  reducers: {
    setAccount: (_, action: PayloadAction<AccountState>) => {
      return action.payload
    },
  },
})

export const { setAccount } = accountSlice.actions
export const accountReducer = accountSlice.reducer

