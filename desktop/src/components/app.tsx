import React from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store";
import {Login} from "@/components/accounts/login";
import {AppLoading} from "@/components/app-loading";
import {setWorkspaces, setAccounts, setLoaded} from "@/store/app-slice";
import {Workspace} from "@/components/workspaces/workspace";
import {AccountContext} from "@/contexts/account";
import Axios from "axios";
import {AxiosContext} from "@/contexts/axios";

const serverUrl = 'http://localhost:3000';

export function App() {
  const appLoaded = useSelector((state: RootState) => state.app.loaded);
  const accounts = useSelector((state: RootState) => state.app.accounts);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!appLoaded) {
      Promise.all([
        window.globalDb.getAccounts(),
        window.globalDb.getWorkspaces(),
      ]).then(([accounts, workspaces]) => {
        dispatch(setAccounts(accounts));
        dispatch(setWorkspaces(workspaces));
        dispatch(setLoaded());
      }).catch((error) => {
        // Handle any errors if needed
        console.error("Error loading data: ", error);
      });
    }
  }, [appLoaded]);

  if (!appLoaded) {
    return <AppLoading />;
  }

  if (accounts.length == 0) {
    return <Login />;
  }

  const account = accounts[0];
  const axios = Axios.create({
    baseURL: serverUrl,
    headers: {
      Authorization: `Bearer ${account.token}`,
    },
  });

  return (
    <AccountContext.Provider value={account}>
      <AxiosContext.Provider value={axios}>
        <Workspace />
      </AxiosContext.Provider>
    </AccountContext.Provider>
  );
}