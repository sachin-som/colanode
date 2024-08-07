import { createContext, useContext } from 'react';
import { Node } from '@/types/nodes';

interface SidebarContext {
  nodes: Node[];
}

export const SidebarContext = createContext<SidebarContext>(
  {} as SidebarContext,
);

export const useSidebar = () => useContext(SidebarContext);
