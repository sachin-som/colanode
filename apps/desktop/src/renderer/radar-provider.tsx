import { RadarContext } from '@/renderer/contexts/radar';
import { useQuery } from '@/renderer/hooks/use-query';

interface RadarProviderProps {
  children: React.ReactNode;
}

export const RadarProvider = ({ children }: RadarProviderProps) => {
  const { data } = useQuery({
    type: 'read_states_get',
  });

  return (
    <RadarContext.Provider
      value={{
        getWorkspaceState: (userId) => {
          return (
            data?.[userId] ?? {
              nodeStates: {},
              importantCount: 0,
              hasUnseenChanges: false,
            }
          );
        },
        getChatState: (userId, nodeId) => {
          const workspaceState = data?.[userId];
          if (workspaceState) {
            const chatState = workspaceState.nodeStates[nodeId];
            if (chatState && chatState.type === 'chat') {
              return chatState;
            }
          }

          return {
            type: 'chat',
            nodeId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        getChannelState: (userId, nodeId) => {
          const workspaceState = data?.[userId];
          if (workspaceState) {
            const channelState = workspaceState.nodeStates[nodeId];
            if (channelState && channelState.type === 'channel') {
              return channelState;
            }
          }

          return {
            type: 'channel',
            nodeId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
