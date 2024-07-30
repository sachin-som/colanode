import React from "react";
import { createRoot } from 'react-dom/client';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {AppLayout} from "@/components/app-layout";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Toaster} from "@/components/ui/toaster";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";

const router = createBrowserRouter([
  {
     path: '',
    element: <AppLayout />
  }
])

function App() {
  return (
    <ReduxProvider store={store}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster />
    </ReduxProvider>
  );
}

const root = createRoot(document.body);
root.render(<App />);