import { AccountGetQueryHandler } from '@/main/queries/accounts/account-get';
import { AccountListQueryHandler } from '@/main/queries/accounts/accounts-list';
import { EmojisGetQueryHandler } from '@/main/queries/emojis/emojis-get';
import { FileListQueryHandler } from '@/main/queries/files/file-list';
import { FileGetQueryHandler } from '@/main/queries/files/file-get';
import { FileMetadataGetQueryHandler } from '@/main/queries/files/file-metadata-get';
import { IconsGetQueryHandler } from '@/main/queries/icons/icons-get';
import { MessageGetQueryHandler } from '@/main/queries/messages/message-get';
import { MessageListQueryHandler } from '@/main/queries/messages/message-list';
import { MessageReactionsGetQueryHandler } from '@/main/queries/messages/message-reactions-get';
import { EntryChildrenGetQueryHandler } from '@/main/queries/entries/entry-children-get';
import { EntryGetQueryHandler } from '@/main/queries/entries/entry-get';
import { EntryTreeGetQueryHandler } from '@/main/queries/entries/entry-tree-get';
import { RadarDataGetQueryHandler } from '@/main/queries/interactions/radar-data-get';
import { RecordListQueryHandler } from '@/main/queries/records/record-list';
import { ServerListQueryHandler } from '@/main/queries/servers/server-list';
import { UserSearchQueryHandler } from '@/main/queries/users/user-search';
import { WorkspaceGetQueryHandler } from '@/main/queries/workspaces/workspace-get';
import { WorkspaceListQueryHandler } from '@/main/queries/workspaces/workspace-list';
import { UserListQueryHandler } from '@/main/queries/users/user-list';
import { DatabaseListQueryHandler } from '@/main/queries/databases/database-list';
import { RecordSearchQueryHandler } from '@/main/queries/records/record-search';
import { UserGetQueryHandler } from '@/main/queries/users/user-get';
import { SpaceListQueryHandler } from '@/main/queries/spaces/space-list';
import { ChatListQueryHandler } from '@/main/queries/chats/chat-list';
import { QueryHandler } from '@/main/types';
import { QueryMap } from '@/shared/queries';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  account_list: new AccountListQueryHandler(),
  message_list: new MessageListQueryHandler(),
  message_reactions_get: new MessageReactionsGetQueryHandler(),
  message_get: new MessageGetQueryHandler(),
  entry_get: new EntryGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  user_list: new UserListQueryHandler(),
  file_list: new FileListQueryHandler(),
  emojis_get: new EmojisGetQueryHandler(),
  icons_get: new IconsGetQueryHandler(),
  entry_tree_get: new EntryTreeGetQueryHandler(),
  entry_children_get: new EntryChildrenGetQueryHandler(),
  radar_data_get: new RadarDataGetQueryHandler(),
  file_metadata_get: new FileMetadataGetQueryHandler(),
  account_get: new AccountGetQueryHandler(),
  workspace_get: new WorkspaceGetQueryHandler(),
  database_list: new DatabaseListQueryHandler(),
  record_search: new RecordSearchQueryHandler(),
  user_get: new UserGetQueryHandler(),
  file_get: new FileGetQueryHandler(),
  chat_list: new ChatListQueryHandler(),
  space_list: new SpaceListQueryHandler(),
};
