import { createContext, useContext } from 'react';

import {
  AccountReadState,
  ChannelReadState,
  ChatReadState,
  WorkspaceReadState,
} from '@/shared/types/radars';

interface RadarContext {
  getAccountState: (accountId: string) => AccountReadState;
  getWorkspaceState: (userId: string) => WorkspaceReadState;
  getChatState: (userId: string, entryId: string) => ChatReadState;
  getChannelState: (userId: string, entryIdId: string) => ChannelReadState;
  markMessageAsSeen: (userId: string, messageId: string) => void;
  markFileAsSeen: (userId: string, fileId: string) => void;
  markFileAsOpened: (userId: string, fileId: string) => void;
  markEntryAsSeen: (userId: string, entryId: string) => void;
  markEntryAsOpened: (userId: string, entryId: string) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
