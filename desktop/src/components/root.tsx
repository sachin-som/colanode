import React from "react";
import { createRoot } from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {App} from "@/components/app";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Toaster} from "@/components/ui/toaster";
import {Provider as ReduxProvider} from "react-redux";
import {store} from "@/store";
import {WorkspaceRedirect} from "@/components/workspaces/workspace-redirect";
import {WorkspaceCreate} from "@/components/workspaces/workspace-create";
import {Workspace} from "@/components/workspaces/workspace";

const router = createBrowserRouter([
  {
    path: '',
    element: <App />,
    children: [
      {
        path: '',
        element: <WorkspaceRedirect />
      },
      {
        path: '/create',
        element: <WorkspaceCreate />
      },
      {
        path: ':workspaceId',
        element: <Workspace />
      }
    ]
  }
])

function Root() {
  return (
    <ReduxProvider store={store}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </ReduxProvider>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);