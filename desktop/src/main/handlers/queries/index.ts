import { QueryHandler, QueryMap } from '@/operations/queries';
import { AccountListQueryHandler } from '@/main/handlers/queries/accounts-list';
import { BreadcrumbListQueryHandler } from '@/main/handlers/queries/breadcrumb-list';
import { DatabaseGetQueryHandler } from '@/main/handlers/queries/database-get';
import { DatabaseViewListQueryHandler } from '@/main/handlers/queries/database-view-list';
import { DocumentGetQueryHandler } from '@/main/handlers/queries/document-get';
import { MessageListQueryHandler } from '@/main/handlers/queries/message-list';
import { NodeCollaboratorListQueryHandler } from '@/main/handlers/queries/node-collaborator-list';
import { NodeCollaboratorSearchQueryHandler } from '@/main/handlers/queries/node-collaborator-search';
import { NodeGetQueryHandler } from '@/main/handlers/queries/node-get';
import { RecordGetQueryHandler } from '@/main/handlers/queries/record-get';
import { ServerListQueryHandler } from '@/main/handlers/queries/server-list';
import { SidebarChatListQueryHandler } from '@/main/handlers/queries/sidebar-chat-list';
import { SidebarSpaceListQueryHandler } from '@/main/handlers/queries/sidebar-space-list';
import { UserSearchQueryHandler } from '@/main/handlers/queries/user-search';
import { WorkspaceListQueryHandler } from '@/main/handlers/queries/workspace-list';
import { WorkspaceUserListQueryHandler } from '@/main/handlers/queries/workspace-user-list';
import { RecordListQueryHandler } from '@/main/handlers/queries/record-list';

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
