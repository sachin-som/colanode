import React from "react";
import {Sidebar} from "@/components/workspaces/sidebar";
import {WorkspaceCreate} from "@/components/workspaces/workspace-create";
import {WorkspaceContext} from "@/contexts/workspace";
import {useSelector} from "@/store";

export function Workspace() {
  const workspaces = useSelector(state => state.app.workspaces);
  if (workspaces.length === 0) {
    return <WorkspaceCreate />;
  }

  const workspace = workspaces[0];

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="flex h-screen max-h-screen flex-row">
        <div className="w-96">
          <Sidebar />
        </div>
        <main className="h-full w-full min-w-128 flex-grow overflow-hidden bg-white">
          <p>content goes here.</p>
        </main>
      </div>
    </WorkspaceContext.Provider>
  )
}