import { QueryHandler, QueryMap } from '@/types/queries';
import { AccountListQueryHandler } from '@/electron/queries/accounts-list';
import { BreadcrumbListQueryHandler } from '@/electron/queries/breadcrumb-list';
import { DatabaseGetQueryHandler } from '@/electron/queries/database-get';
import { DatabaseViewListQueryHandler } from '@/electron/queries/database-view-list';
import { DocumentGetQueryHandler } from '@/electron/queries/document-get';
import { MessageListQueryHandler } from '@/electron/queries/message-list';
import { NodeCollaboratorListQueryHandler } from '@/electron/queries/node-collaborator-list';
import { NodeCollaboratorSearchQueryHandler } from '@/electron/queries/node-collaborator-search';
import { NodeGetQueryHandler } from '@/electron/queries/node-get';
import { RecordGetQueryHandler } from '@/electron/queries/record-get';
import { ServerListQueryHandler } from '@/electron/queries/server-list';
import { SidebarChatListQueryHandler } from '@/electron/queries/sidebar-chat-list';
import { SidebarSpaceListQueryHandler } from '@/electron/queries/sidebar-space-list';
import { UserSearchQueryHandler } from '@/electron/queries/user-search';
import { WorkspaceListQueryHandler } from '@/electron/queries/workspace-list';
import { WorkspaceUserListQueryHandler } from '@/electron/queries/workspace-user-list';
import { RecordListQueryHandler } from '@/electron/queries/record-list';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  account_list: new AccountListQueryHandler(),
  breadcrumb_list: new BreadcrumbListQueryHandler(),
  database_get: new DatabaseGetQueryHandler(),
  database_view_list: new DatabaseViewListQueryHandler(),
  document_get: new DocumentGetQueryHandler(),
  message_list: new MessageListQueryHandler(),
  node_collaborator_list: new NodeCollaboratorListQueryHandler(),
  node_collaborator_search: new NodeCollaboratorSearchQueryHandler(),
  node_get: new NodeGetQueryHandler(),
  record_get: new RecordGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  sidebar_chat_list: new SidebarChatListQueryHandler(),
  sidebar_space_list: new SidebarSpaceListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  workspace_user_list: new WorkspaceUserListQueryHandler(),
};
