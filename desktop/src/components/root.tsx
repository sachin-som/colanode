import React from "react";
import { createRoot } from 'react-dom/client';
import {App} from "@/components/app";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Toaster} from "@/components/ui/toaster";
import {StoreContext} from "@/contexts/store";
import {store} from "@/store";

export const Root = () => {
  return (
    <StoreContext.Provider value={store}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster />
    </StoreContext.Provider>
  );
}

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);