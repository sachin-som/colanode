import { createContext, useContext } from 'react';
import { LocalNode } from '@/types/nodes';

interface SidebarContext {
  nodes: LocalNode[];
}

export const SidebarContext = createContext<SidebarContext>(
  {} as SidebarContext,
);

export const useSidebar = () => useContext(SidebarContext);
