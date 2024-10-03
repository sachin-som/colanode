import { MutationHandler, MutationMap } from '@/types/mutations';
import { EmailLoginMutationHandler } from '@/electron/mutations/email-login';
import { EmailRegisterMutationHandler } from '@/electron/mutations/email-register';
import { BoardViewCreateMutationHandler } from '@/electron/mutations/board-view-create';
import { CalendarViewCreateMutationHandler } from '@/electron/mutations/calendar-view-create';
import { ChannelCreateMutationHandler } from '@/electron/mutations/channel-create';
import { ChatCreateMutationHandler } from '@/electron/mutations/chat-create';
import { TableViewCreateMutationHandler } from '@/electron/mutations/table-view-create';
import { DatabaseCreateMutationHandler } from '@/electron/mutations/database-create';
import { FieldCreateMutationHandler } from '@/electron/mutations/field-create';
import { MessageCreateMutationHandler } from '@/electron/mutations/message-create';
import { NodeAttributeDeleteMutationHandler } from '@/electron/mutations/node-attribute-delete';
import { NodeAttributeSetMutationHandler } from '@/electron/mutations/node-attribute-set';
import { NodeCollaboratorCreateMutationHandler } from '@/electron/mutations/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/electron/mutations/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/electron/mutations/node-collaborator-update';
import { NodeDeleteMutationHandler } from '@/electron/mutations/node-delete';
import { PageCreateMutationHandler } from '@/electron/mutations/page-create';
import { NodeReactionCreateMutationHandler } from '@/electron/mutations/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from '@/electron/mutations/node-reaction-delete';
import { RecordCreateMutationHandler } from '@/electron/mutations/record-create';
import { SelectOptionCreateMutationHandler } from '@/electron/mutations/select-option-create';
import { ServerCreateMutationHandler } from '@/electron/mutations/server-create';
import { SpaceCreateMutationHandler } from '@/electron/mutations/space-create';
import { WorkspaceAccountRoleUpdateMutationHandler } from '@/electron/mutations/workspace-account-role-update';
import { WorkspaceAccountsInviteMutationHandler } from '@/electron/mutations/workspace-accounts-invite';
import { WorkspaceCreateMutationHandler } from '@/electron/mutations/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/electron/mutations/workspace-update';

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
};
