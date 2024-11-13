import { QueryMap } from '@/operations/queries';
import { QueryHandler } from '@/main/types';
import { AccountListQueryHandler } from '@/main/handlers/queries/accounts-list';
import { MessageListQueryHandler } from '@/main/handlers/queries/message-list';
import { NodeGetQueryHandler } from '@/main/handlers/queries/node-get';
import { ServerListQueryHandler } from '@/main/handlers/queries/server-list';
import { UserSearchQueryHandler } from '@/main/handlers/queries/user-search';
import { WorkspaceListQueryHandler } from '@/main/handlers/queries/workspace-list';
import { WorkspaceUserListQueryHandler } from '@/main/handlers/queries/workspace-user-list';
import { RecordListQueryHandler } from '@/main/handlers/queries/record-list';
import { FileListQueryHandler } from '@/main/handlers/queries/file-list';
import { EmojisGetQueryHandler } from '@/main/handlers/queries/emojis-get';
import { IconsGetQueryHandler } from '@/main/handlers/queries/icons-get';
import { NodeTreeGetQueryHandler } from '@/main/handlers/queries/node-tree-get';
import { NodeChildrenGetQueryHandler } from '@/main/handlers/queries/node-children-get';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  account_list: new AccountListQueryHandler(),
  message_list: new MessageListQueryHandler(),
  node_get: new NodeGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  workspace_user_list: new WorkspaceUserListQueryHandler(),
  file_list: new FileListQueryHandler(),
  emojis_get: new EmojisGetQueryHandler(),
  icons_get: new IconsGetQueryHandler(),
  node_tree_get: new NodeTreeGetQueryHandler(),
  node_children_get: new NodeChildrenGetQueryHandler(),
};
