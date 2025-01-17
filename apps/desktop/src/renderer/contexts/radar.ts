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
  markMessageAsSeen: (
    accountId: string,
    workspaceId: string,
    messageId: string
  ) => void;
  markFileAsSeen: (
    accountId: string,
    workspaceId: string,
    fileId: string
  ) => void;
  markFileAsOpened: (
    accountId: string,
    workspaceId: string,
    fileId: string
  ) => void;
  markEntryAsSeen: (
    accountId: string,
    workspaceId: string,
    entryId: string
  ) => void;
  markEntryAsOpened: (
    accountId: string,
    workspaceId: string,
    entryId: string
  ) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
