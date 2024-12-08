import { createContext, useContext } from 'react';
import { NodeType } from '@colanode/core';

import {
  AccountReadState,
  ChannelReadState,
  ChatReadState,
  WorkspaceReadState,
} from '@/shared/types/radars';

interface RadarContext {
  getAccountState: (accountId: string) => AccountReadState;
  getWorkspaceState: (userId: string) => WorkspaceReadState;
  getChatState: (userId: string, nodeId: string) => ChatReadState;
  getChannelState: (userId: string, nodeId: string) => ChannelReadState;
  markAsSeen: (
    userId: string,
    nodeId: string,
    nodeType: NodeType,
    transactionId: string
  ) => void;
  markAsOpened: (
    userId: string,
    nodeId: string,
    nodeType: NodeType,
    transactionId: string
  ) => void;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
