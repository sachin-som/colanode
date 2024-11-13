import {
  ChannelReadState,
  ChatReadState,
  WorkspaceReadState,
} from '@/shared/types/radars';
import { createContext, useContext } from 'react';

interface RadarContext {
  getWorkspaceState: (userId: string) => WorkspaceReadState;
  getChatState: (userId: string, nodeId: string) => ChatReadState;
  getChannelState: (userId: string, nodeId: string) => ChannelReadState;
}

export const RadarContext = createContext<RadarContext>({} as RadarContext);

export const useRadar = () => useContext(RadarContext);
