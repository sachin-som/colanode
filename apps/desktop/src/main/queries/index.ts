import { AppMetadataListQueryHandler } from '@/main/queries/apps/app-metadata-list';
import { AccountGetQueryHandler } from '@/main/queries/accounts/account-get';
import { AccountListQueryHandler } from '@/main/queries/accounts/accounts-list';
import { EmojiGetQueryHandler } from '@/main/queries/emojis/emoji-get';
import { EmojiListQueryHandler } from '@/main/queries/emojis/emoji-list';
import { EmojiCategoryListQueryHandler } from '@/main/queries/emojis/emoji-category-list';
import { EmojiSearchQueryHandler } from '@/main/queries/emojis/emoji-search';
import { EmojiGetBySkinIdQueryHandler } from '@/main/queries/emojis/emoji-get-by-skin-id';
import { FileListQueryHandler } from '@/main/queries/files/file-list';
import { FileGetQueryHandler } from '@/main/queries/files/file-get';
import { FileMetadataGetQueryHandler } from '@/main/queries/files/file-metadata-get';
import { FileBreadcrumbGetQueryHandler } from '@/main/queries/files/file-breadcrumb-get';
import { IconListQueryHandler } from '@/main/queries/icons/icon-list';
import { IconSearchQueryHandler } from '@/main/queries/icons/icon-search';
import { IconCategoryListQueryHandler } from '@/main/queries/icons/icon-category-list';
import { MessageGetQueryHandler } from '@/main/queries/messages/message-get';
import { MessageListQueryHandler } from '@/main/queries/messages/message-list';
import { MessageReactionsListQueryHandler } from '@/main/queries/messages/message-reaction-list';
import { MessageReactionsAggregateQueryHandler } from '@/main/queries/messages/message-reactions-aggregate';
import { MessageBreadcrumbGetQueryHandler } from '@/main/queries/messages/message-breadcrumb-get';
import { EntryChildrenGetQueryHandler } from '@/main/queries/entries/entry-children-get';
import { EntryGetQueryHandler } from '@/main/queries/entries/entry-get';
import { EntryBreadcrumbGetQueryHandler } from '@/main/queries/entries/entry-breadcrumb-get';
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
import { WorkspaceMetadataListQueryHandler } from '@/main/queries/workspaces/workspace-metadata-list';
import { QueryHandler } from '@/main/lib/types';
import { QueryMap } from '@/shared/queries';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  app_metadata_list: new AppMetadataListQueryHandler(),
  account_list: new AccountListQueryHandler(),
  message_list: new MessageListQueryHandler(),
  message_reaction_list: new MessageReactionsListQueryHandler(),
  message_reactions_aggregate: new MessageReactionsAggregateQueryHandler(),
  message_get: new MessageGetQueryHandler(),
  message_breadcrumb_get: new MessageBreadcrumbGetQueryHandler(),
  entry_get: new EntryGetQueryHandler(),
  entry_breadcrumb_get: new EntryBreadcrumbGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  user_list: new UserListQueryHandler(),
  file_list: new FileListQueryHandler(),
  emoji_list: new EmojiListQueryHandler(),
  emoji_get: new EmojiGetQueryHandler(),
  emoji_get_by_skin_id: new EmojiGetBySkinIdQueryHandler(),
  emoji_category_list: new EmojiCategoryListQueryHandler(),
  emoji_search: new EmojiSearchQueryHandler(),
  icon_list: new IconListQueryHandler(),
  icon_search: new IconSearchQueryHandler(),
  icon_category_list: new IconCategoryListQueryHandler(),
  entry_children_get: new EntryChildrenGetQueryHandler(),
  radar_data_get: new RadarDataGetQueryHandler(),
  file_metadata_get: new FileMetadataGetQueryHandler(),
  file_breadcrumb_get: new FileBreadcrumbGetQueryHandler(),
  account_get: new AccountGetQueryHandler(),
  workspace_get: new WorkspaceGetQueryHandler(),
  database_list: new DatabaseListQueryHandler(),
  record_search: new RecordSearchQueryHandler(),
  user_get: new UserGetQueryHandler(),
  file_get: new FileGetQueryHandler(),
  chat_list: new ChatListQueryHandler(),
  space_list: new SpaceListQueryHandler(),
  workspace_metadata_list: new WorkspaceMetadataListQueryHandler(),
};
