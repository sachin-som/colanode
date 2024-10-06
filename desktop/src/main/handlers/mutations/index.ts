import { MutationHandler, MutationMap } from '@/operations/mutations';
import { EmailLoginMutationHandler } from '@/main/handlers/mutations/email-login';
import { EmailRegisterMutationHandler } from '@/main/handlers/mutations/email-register';
import { BoardViewCreateMutationHandler } from '@/main/handlers/mutations/board-view-create';
import { CalendarViewCreateMutationHandler } from '@/main/handlers/mutations/calendar-view-create';
import { ChannelCreateMutationHandler } from '@/main/handlers/mutations/channel-create';
import { ChatCreateMutationHandler } from '@/main/handlers/mutations/chat-create';
import { TableViewCreateMutationHandler } from '@/main/handlers/mutations/table-view-create';
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
import { WorkspaceAccountRoleUpdateMutationHandler } from '@/main/handlers/mutations/workspace-account-role-update';
import { WorkspaceAccountsInviteMutationHandler } from '@/main/handlers/mutations/workspace-accounts-invite';
import { WorkspaceCreateMutationHandler } from '@/main/handlers/mutations/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/handlers/mutations/workspace-update';
import { NodeSyncMutationHandler } from '@/main/handlers/mutations/node-sync';
import { NodeReactionSyncMutationHandler } from '@/main/handlers/mutations/node-reaction-sync';
import { NodeCollaboratorSyncMutationHandler } from '@/main/handlers/mutations/node-collaborator-sync';
import { DocumentSaveMutationHandler } from '@/main/handlers/mutations/document-save';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  board_view_create: new BoardViewCreateMutationHandler(),
  calendar_view_create: new CalendarViewCreateMutationHandler(),
  channel_create: new ChannelCreateMutationHandler(),
  chat_create: new ChatCreateMutationHandler(),
  table_view_create: new TableViewCreateMutationHandler(),
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
  workspace_account_role_update:
    new WorkspaceAccountRoleUpdateMutationHandler(),
  workspace_accounts_invite: new WorkspaceAccountsInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  node_sync: new NodeSyncMutationHandler(),
  node_reaction_sync: new NodeReactionSyncMutationHandler(),
  node_collaborator_sync: new NodeCollaboratorSyncMutationHandler(),
  document_save: new DocumentSaveMutationHandler(),
};
