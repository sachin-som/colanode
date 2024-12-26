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
          const workspaceStates = Object.values(radarData).filter(
            (state) => state.accountId === accountId
          );

          const importantCount = workspaceStates.reduce(
            (acc, state) => acc + state.importantCount,
            0
          );

          const hasUnseenChanges = workspaceStates.some(
            (state) => state.hasUnseenChanges
          );

          return {
            importantCount,
            hasUnseenChanges,
          };
        },
        getWorkspaceState: (userId) => {
          const workspaceState = radarData[userId];
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
        getChatState: (userId, entryId) => {
          const workspaceState = radarData[userId];
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
        getChannelState: (userId, entryId) => {
          const workspaceState = radarData[userId];
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
        markMessageAsSeen: (userId, messageId) => {
          window.colanode.executeMutation({
            type: 'message_mark_seen',
            messageId,
            userId,
          });
        },
        markFileAsSeen: (userId, fileId) => {
          window.colanode.executeMutation({
            type: 'file_mark_seen',
            fileId,
            userId,
          });
        },
        markFileAsOpened: (userId, fileId) => {
          window.colanode.executeMutation({
            type: 'file_mark_opened',
            fileId,
            userId,
          });
        },
        markEntryAsSeen: (userId, entryId) => {
          window.colanode.executeMutation({
            type: 'entry_mark_seen',
            entryId,
            userId,
          });
        },
        markEntryAsOpened: (userId, entryId) => {
          window.colanode.executeMutation({
            type: 'entry_mark_opened',
            entryId,
            userId,
          });
        },
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};
