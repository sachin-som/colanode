import React from "react";
import { createRoot } from 'react-dom/client';
import {App} from "@/components/app";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Toaster} from "@/components/ui/toaster";
import {Provider as ReduxProvider} from "react-redux";
import {store} from "@/store";

function Root() {
  return (
    <ReduxProvider store={store}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster />
    </ReduxProvider>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);