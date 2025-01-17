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
        getChatState: (accountId, workspaceId, entryId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            const chatState = workspaceState.nodeStates[entryId];
            if (chatState && chatState.type === 'chat') {
              return chatState;
            }
          }

          return {
            type: 'chat',
            chatId: entryId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        getChannelState: (accountId, workspaceId, entryId) => {
          const workspaceState = radarData[accountId]?.[workspaceId];
          if (workspaceState) {
            const channelState = workspaceState.nodeStates[entryId];
            if (channelState && channelState.type === 'channel') {
              return channelState;
            }
          }

          return {
            type: 'channel',
            channelId: entryId,
            unseenMessagesCount: 0,
            mentionsCount: 0,
          };
        },
        markMessageAsSeen: (accountId, workspaceId, messageId) => {
          window.colanode.executeMutation({
            type: 'message_mark_seen',
            messageId,
            accountId,
            workspaceId,
          });
        },
        markFileAsSeen: (accountId, workspaceId, fileId) => {
          window.colanode.executeMutation({
            type: 'file_mark_seen',
            fileId,
            accountId,
            workspaceId,
          });
        },
        markFileAsOpened: (accountId, workspaceId, fileId) => {
          window.colanode.executeMutation({
            type: 'file_mark_opened',
            fileId,
            accountId,
            workspaceId,
          });
        },
        markEntryAsSeen: (accountId, workspaceId, entryId) => {
          window.colanode.executeMutation({
            type: 'entry_mark_seen',
            entryId,
            accountId,
            workspaceId,
          });
        },
        markEntryAsOpened: (accountId, workspaceId, entryId) => {
          window.colanode.executeMutation({
            type: 'entry_mark_opened',
            entryId,
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
