import { MutationMap } from '@/operations/mutations';
import { MutationHandler } from '@/main/types';
import { EmailLoginMutationHandler } from '@/main/handlers/mutations/email-login';
import { EmailRegisterMutationHandler } from '@/main/handlers/mutations/email-register';
import { ViewCreateMutationHandler } from '@/main/handlers/mutations/view-create';
import { ChannelCreateMutationHandler } from '@/main/handlers/mutations/channel-create';
import { ChatCreateMutationHandler } from '@/main/handlers/mutations/chat-create';
import { DatabaseCreateMutationHandler } from '@/main/handlers/mutations/database-create';
import { FieldCreateMutationHandler } from '@/main/handlers/mutations/field-create';
import { MessageCreateMutationHandler } from '@/main/handlers/mutations/message-create';
import { NodeAttributeDeleteMutationHandler } from '@/main/handlers/mutations/node-attribute-delete';
import { NodeAttributeSetMutationHandler } from '@/main/handlers/mutations/node-attribute-set';
import { NodeCollaboratorCreateMutationHandler } from '@/main/handlers/mutations/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/main/handlers/mutations/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/main/handlers/mutations/node-collaborator-update';
import { NodeDeleteMutationHandler } from '@/main/handlers/mutations/node-delete';
import { PageCreateMutationHandler } from '@/main/handlers/mutations/page-create';
import { NodeReactionCreateMutationHandler } from '@/main/handlers/mutations/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from '@/main/handlers/mutations/node-reaction-delete';
import { RecordCreateMutationHandler } from '@/main/handlers/mutations/record-create';
import { SelectOptionCreateMutationHandler } from '@/main/handlers/mutations/select-option-create';
import { ServerCreateMutationHandler } from '@/main/handlers/mutations/server-create';
import { SpaceCreateMutationHandler } from '@/main/handlers/mutations/space-create';
import { WorkspaceUserRoleUpdateMutationHandler } from '@/main/handlers/mutations/workspace-user-role-update';
import { WorkspaceUsersInviteMutationHandler } from '@/main/handlers/mutations/workspace-users-invite';
import { WorkspaceCreateMutationHandler } from '@/main/handlers/mutations/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/handlers/mutations/workspace-update';
import { DocumentSaveMutationHandler } from '@/main/handlers/mutations/document-save';
import { AvatarUploadMutationHandler } from '@/main/handlers/mutations/avatar-upload';
import { LogoutMutationHandler } from '@/main/handlers/mutations/logout';
import { ServerNodeSyncMutationHandler } from '@/main/handlers/mutations/server-node-sync';
import { ServerNodeDeleteMutationHandler } from '@/main/handlers/mutations/server-node-delete';
import { FolderCreateMutationHandler } from '@/main/handlers/mutations/folder-create';
import { FileCreateMutationHandler } from '@/main/handlers/mutations/file-create';
import { FileDownloadMutationHandler } from '@/main/handlers/mutations/file-download';
import { SpaceUpdateMutationHandler } from '@/main/handlers/mutations/space-update';
import { AccountUpdateMutationHandler } from '@/main/handlers/mutations/account-update';
import { ServerUserNodeSyncMutationHandler } from '@/main/handlers/mutations/server-user-node-sync';
import { MarkNodeAsSeenMutationHandler } from '@/main/handlers/mutations/mark-node-as-seen';
import { ViewUpdateMutationHandler } from '@/main/handlers/mutations/view-update';
import { ViewDeleteMutationHandler } from '@/main/handlers/mutations/view-delete';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  view_create: new ViewCreateMutationHandler(),
  channel_create: new ChannelCreateMutationHandler(),
  chat_create: new ChatCreateMutationHandler(),
  database_create: new DatabaseCreateMutationHandler(),
  field_create: new FieldCreateMutationHandler(),
  message_create: new MessageCreateMutationHandler(),
  node_attribute_delete: new NodeAttributeDeleteMutationHandler(),
  node_attribute_set: new NodeAttributeSetMutationHandler(),
  node_collaborator_create: new NodeCollaboratorCreateMutationHandler(),
  node_collaborator_delete: new NodeCollaboratorDeleteMutationHandler(),
  node_collaborator_update: new NodeCollaboratorUpdateMutationHandler(),
  node_delete: new NodeDeleteMutationHandler(),
  page_create: new PageCreateMutationHandler(),
  node_reaction_create: new NodeReactionCreateMutationHandler(),
  node_reaction_delete: new NodeReactionDeleteMutationHandler(),
  record_create: new RecordCreateMutationHandler(),
  select_option_create: new SelectOptionCreateMutationHandler(),
  server_create: new ServerCreateMutationHandler(),
  space_create: new SpaceCreateMutationHandler(),
  workspace_user_role_update: new WorkspaceUserRoleUpdateMutationHandler(),
  workspace_users_invite: new WorkspaceUsersInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  document_save: new DocumentSaveMutationHandler(),
  avatar_upload: new AvatarUploadMutationHandler(),
  logout: new LogoutMutationHandler(),
  server_node_sync: new ServerNodeSyncMutationHandler(),
  server_node_delete: new ServerNodeDeleteMutationHandler(),
  folder_create: new FolderCreateMutationHandler(),
  file_create: new FileCreateMutationHandler(),
  file_download: new FileDownloadMutationHandler(),
  space_update: new SpaceUpdateMutationHandler(),
  account_update: new AccountUpdateMutationHandler(),
  server_user_node_sync: new ServerUserNodeSyncMutationHandler(),
  mark_node_as_seen: new MarkNodeAsSeenMutationHandler(),
  view_update: new ViewUpdateMutationHandler(),
  view_delete: new ViewDeleteMutationHandler(),
};
