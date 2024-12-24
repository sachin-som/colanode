import { createContext, useContext } from 'react';
import { EntryType } from '@colanode/core';

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
  markAsSeen: (
    userId: string,
    entryId: string,
    entryType: EntryType,
    transactionId: string
  ) => void;
  markAsOpened: (
    userId: string,
    entryId: string,
    entryType: EntryType,
    transactionId: string
  ) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
