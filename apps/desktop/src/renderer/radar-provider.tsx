import { RadarContext } from '@/renderer/contexts/radar';
import { useQuery } from '@/renderer/hooks/use-query';

interface RadarProviderProps {
  children: React.ReactNode;
}

export const RadarProvider = ({ children }: RadarProviderProps) => {
  const { data } = useQuery({
    type: 'radar_data_get',
  });

  const radarData = data ?? {};
  return (
    <RadarContext.Provider
      value={{
        getAccountState: (accountId) => {
          const accountState = radarData[accountId];
          if (!accountState) {
            return {
              importantCount: 0,
              hasUnseenChanges: false,
            };
          }

          const importantCount = Object.values(accountState).reduce(
            (acc, state) => acc + state.importantCount,
            0
          );

          const hasUnseenChanges = Object.values(accountState).some(
            (state) => state.hasUnseenChanges
          );

          return {
            importantCount,
            hasUnseenChanges,
          };
        },
        getWorkspaceState: (accountId, workspaceId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            return {
              hasUnseenChanges: workspaceState.hasUnseenChanges,
              importantCount: workspaceState.importantCount,
            };
          }

          return {
            nodeStates: {},
            importantCount: 0,
            hasUnseenChanges: false,
          };
        },
        getChatState: (accountId, workspaceId, chatId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            const chatState = workspaceState.nodeStates[chatId];
            if (chatState && chatState.type === 'chat') {
              return chatState;
            }
          }

          return {
            type: 'chat',
            chatId: chatId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        getChannelState: (accountId, workspaceId, channelId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            const channelState = workspaceState.nodeStates[channelId];
            if (channelState && channelState.type === 'channel') {
              return channelState;
            }
          }

          return {
            type: 'channel',
            channelId: channelId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        markNodeAsSeen: (accountId, workspaceId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node_mark_seen',
            nodeId,
            accountId,
            workspaceId,
          });
        },
        markNodeAsOpened: (accountId, workspaceId, nodeId) => {
          window.colanode.executeMutation({
            type: 'node_mark_opened',
            nodeId,
            accountId,
            workspaceId,
          });
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
