import { configureStore } from '@reduxjs/toolkit'
import {useSelector as useReduxSelector} from "react-redux";
import {appReducer} from "@/store/app-slice";

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export function useSelector<T>(selector: (state: RootState) => T) {
  return useReduxSelector(selector);
}