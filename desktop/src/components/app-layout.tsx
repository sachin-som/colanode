import React from "react";
import {useSelector} from "react-redux";
import {RootState} from "@/store";
import {Login} from "@/components/accounts/login";

export function AppLayout() {
  const account = useSelector((state: RootState) => state.account);

  if (!account) {
    return <Login />;
  }

  return (
    <div>
      <p>Welcome {account.name}</p>
    </div>
  )
}