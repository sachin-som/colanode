import { createContext, useContext } from 'react';

import {
  AccountReadState,
  ChannelReadState,
  ChatReadState,
  WorkspaceReadState,
} from '@/shared/types/radars';

interface RadarContext {
  getAccountState: (accountId: string) => AccountReadState;
  getWorkspaceState: (
    accountId: string,
    workspaceId: string
  ) => WorkspaceReadState;
  getChatState: (
    accountId: string,
    workspaceId: string,
    entryId: string
  ) => ChatReadState;
  getChannelState: (
    accountId: string,
    workspaceId: string,
    entryId: string
  ) => ChannelReadState;
  markNodeAsSeen: (
    accountId: string,
    workspaceId: string,
    nodeId: string
  ) => void;
  markNodeAsOpened: (
    accountId: string,
    workspaceId: string,
    nodeId: string
  ) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
