import React, {useEffect} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@/store";
import {useNavigate} from "react-router-dom";
import {AppLoading} from "@/components/app-loading";

export function WorkspaceRedirect() {
  const workspaces = useSelector((state: RootState) => state.workspaces);
  const navigate = useNavigate();

  useEffect(() => {
    if (workspaces.workspaces.length == 0) {
      navigate('/create');
      return;
    }

    navigate(`/${workspaces.workspaces[0].id}`);
  }, [workspaces, navigate])

  return <AppLoading />;
}