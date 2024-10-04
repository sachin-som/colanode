import { MutationHandler, MutationMap } from '@/types/mutations';
import { EmailLoginMutationHandler } from '@/main/mutations/email-login';
import { EmailRegisterMutationHandler } from '@/main/mutations/email-register';
import { BoardViewCreateMutationHandler } from '@/main/mutations/board-view-create';
import { CalendarViewCreateMutationHandler } from '@/main/mutations/calendar-view-create';
import { ChannelCreateMutationHandler } from '@/main/mutations/channel-create';
import { ChatCreateMutationHandler } from '@/main/mutations/chat-create';
import { TableViewCreateMutationHandler } from '@/main/mutations/table-view-create';
import { DatabaseCreateMutationHandler } from '@/main/mutations/database-create';
import { FieldCreateMutationHandler } from '@/main/mutations/field-create';
import { MessageCreateMutationHandler } from '@/main/mutations/message-create';
import { NodeAttributeDeleteMutationHandler } from '@/main/mutations/node-attribute-delete';
import { NodeAttributeSetMutationHandler } from '@/main/mutations/node-attribute-set';
import { NodeCollaboratorCreateMutationHandler } from '@/main/mutations/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/main/mutations/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/main/mutations/node-collaborator-update';
import { NodeDeleteMutationHandler } from '@/main/mutations/node-delete';
import { PageCreateMutationHandler } from '@/main/mutations/page-create';
import { NodeReactionCreateMutationHandler } from '@/main/mutations/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from '@/main/mutations/node-reaction-delete';
import { RecordCreateMutationHandler } from '@/main/mutations/record-create';
import { SelectOptionCreateMutationHandler } from '@/main/mutations/select-option-create';
import { ServerCreateMutationHandler } from '@/main/mutations/server-create';
import { SpaceCreateMutationHandler } from '@/main/mutations/space-create';
import { WorkspaceAccountRoleUpdateMutationHandler } from '@/main/mutations/workspace-account-role-update';
import { WorkspaceAccountsInviteMutationHandler } from '@/main/mutations/workspace-accounts-invite';
import { WorkspaceCreateMutationHandler } from '@/main/mutations/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/mutations/workspace-update';
import { NodeSyncMutationHandler } from '@/main/mutations/node-sync';
import { NodeReactionSyncMutationHandler } from '@/main/mutations/node-reaction-sync';
import { NodeCollaboratorSyncMutationHandler } from '@/main/mutations/node-collaborator-sync';

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
};
