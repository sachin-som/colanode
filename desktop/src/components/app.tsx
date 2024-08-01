import React from "react";
import {Login} from "@/components/accounts/login";
import {AppLoading} from "@/components/app-loading";
import {Workspace} from "@/components/workspaces/workspace";
import {AccountContext} from "@/contexts/account";
import Axios from "axios";
import {AxiosContext} from "@/contexts/axios";
import {useStore} from "@/contexts/store";
import {observer} from "mobx-react-lite";

const serverUrl = 'http://localhost:3000';

export const App = observer(() => {
  const store = useStore();

  React.useEffect(() => {
    if (!store.loaded) {
      Promise.all([
        window.globalDb.getAccounts(),
        window.globalDb.getWorkspaces(),
      ]).then(([accounts, workspaces]) => {
        store.setAccounts(accounts);
        store.setWorkspaces(workspaces);
        store.setLoaded();
      }).catch((error) => {
        // Handle any errors if needed
        console.error("Error loading data: ", error);
      });
    }
  }, [store.loaded]);

  if (!store.loaded) {
    return <AppLoading />;
  }

  if (store.accounts.length == 0) {
    return <Login />;
  }

  const account = store.accounts[0];
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
});