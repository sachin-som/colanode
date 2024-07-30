import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store";
import {Login} from "@/components/accounts/login";
import {AppLoading} from "@/components/app-loading";
import {setWorkspaces} from "@/store/workspaces-slice";
import {Outlet} from "react-router-dom";

export function App() {
  const account = useSelector((state: RootState) => state.account);
  const workspaces = useSelector((state: RootState) => state.workspaces);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!account) {
      return;
    }

    if (!workspaces.loaded) {
      // load workspaces async
      window.globalDb.getWorkspaces().then((workspaces) => {
        // dispatch action to store workspaces
        dispatch(setWorkspaces(workspaces));
      });
    }

  }, [])

  if (!account) {
    return <Login />;
  }

  if (!workspaces.loaded) {
    return <AppLoading />
  }

  return <Outlet />
}