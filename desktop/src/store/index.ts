import { configureStore } from '@reduxjs/toolkit'
import { accountReducer } from "@/store/account-slice";
import { workspacesReducer } from "@/store/workspaces-slice";

export const store = configureStore({
  reducer: {
    account: accountReducer,
    workspaces: workspacesReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
