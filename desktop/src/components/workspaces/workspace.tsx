import React from "react";
import {useParams} from "react-router-dom";

export function Workspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div>
      <p>Workspace data here {workspaceId}</p>
    </div>
  )
}