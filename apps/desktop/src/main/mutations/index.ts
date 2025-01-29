import { PageContentUpdateMutationHandler } from '@/main/mutations/pages/page-content-update';
import { RecordContentUpdateMutationHandler } from '@/main/mutations/records/record-content-update';
import { AccountLogoutMutationHandler } from '@/main/mutations/accounts/account-logout';
import { AccountUpdateMutationHandler } from '@/main/mutations/accounts/account-update';
import { AvatarUploadMutationHandler } from '@/main/mutations/avatars/avatar-upload';
import { ChannelCreateMutationHandler } from '@/main/mutations/channels/channel-create';
import { ChannelUpdateMutationHandler } from '@/main/mutations/channels/channel-update';
import { ChannelDeleteMutationHandler } from '@/main/mutations/channels/channel-delete';
import { ChatCreateMutationHandler } from '@/main/mutations/chats/chat-create';
import { DatabaseCreateMutationHandler } from '@/main/mutations/databases/database-create';
import { DatabaseUpdateMutationHandler } from '@/main/mutations/databases/database-update';
import { DatabaseDeleteMutationHandler } from '@/main/mutations/databases/database-delete';
import { EmailLoginMutationHandler } from '@/main/mutations/accounts/email-login';
import { EmailRegisterMutationHandler } from '@/main/mutations/accounts/email-register';
import { EmailVerifyMutationHandler } from '@/main/mutations/accounts/email-verify';
import { FieldCreateMutationHandler } from '@/main/mutations/databases/field-create';
import { FieldDeleteMutationHandler } from '@/main/mutations/databases/field-delete';
import { FieldNameUpdateMutationHandler } from '@/main/mutations/databases/field-name-update';
import { FileCreateMutationHandler } from '@/main/mutations/files/file-create';
import { FileDeleteMutationHandler } from '@/main/mutations/files/file-delete';
import { FileDownloadMutationHandler } from '@/main/mutations/files/file-download';
import { FileMarkOpenedMutationHandler } from '@/main/mutations/files/file-mark-opened';
import { FileMarkSeenMutationHandler } from '@/main/mutations/files/file-mark-seen';
import { FileSaveTempMutationHandler } from '@/main/mutations/files/file-save-temp';
import { FolderCreateMutationHandler } from '@/main/mutations/folders/folder-create';
import { FolderUpdateMutationHandler } from '@/main/mutations/folders/folder-update';
import { FolderDeleteMutationHandler } from '@/main/mutations/folders/folder-delete';
import { MessageCreateMutationHandler } from '@/main/mutations/messages/message-create';
import { MessageDeleteMutationHandler } from '@/main/mutations/messages/message-delete';
import { EntryCollaboratorCreateMutationHandler } from '@/main/mutations/entries/entry-collaborator-create';
import { EntryCollaboratorDeleteMutationHandler } from '@/main/mutations/entries/entry-collaborator-delete';
import { EntryCollaboratorUpdateMutationHandler } from '@/main/mutations/entries/entry-collaborator-update';
import { EntryMarkOpenedMutationHandler } from '@/main/mutations/entries/entry-mark-opened';
import { EntryMarkSeenMutationHandler } from '@/main/mutations/entries/entry-mark-seen';
import { MessageReactionCreateMutationHandler } from '@/main/mutations/messages/message-reaction-create';
import { MessageReactionDeleteMutationHandler } from '@/main/mutations/messages/message-reaction-delete';
import { MessageMarkSeenMutationHandler } from '@/main/mutations/messages/message-mark-seen';
import { PageCreateMutationHandler } from '@/main/mutations/pages/page-create';
import { PageUpdateMutationHandler } from '@/main/mutations/pages/page-update';
import { PageDeleteMutationHandler } from '@/main/mutations/pages/page-delete';
import { RecordAvatarUpdateMutationHandler } from '@/main/mutations/records/record-avatar-update';
import { RecordCreateMutationHandler } from '@/main/mutations/records/record-create';
import { RecordDeleteMutationHandler } from '@/main/mutations/records/record-delete';
import { RecordFieldValueDeleteMutationHandler } from '@/main/mutations/records/record-field-value-delete';
import { RecordNameUpdateMutationHandler } from '@/main/mutations/records/record-name-update';
import { RecordFieldValueSetMutationHandler } from '@/main/mutations/records/record-field-value-set';
import { SelectOptionCreateMutationHandler } from '@/main/mutations/databases/select-option-create';
import { SelectOptionDeleteMutationHandler } from '@/main/mutations/databases/select-option-delete';
import { SelectOptionUpdateMutationHandler } from '@/main/mutations/databases/select-option-update';
import { ServerCreateMutationHandler } from '@/main/mutations/servers/server-create';
import { SpaceCreateMutationHandler } from '@/main/mutations/spaces/space-create';
import { SpaceDeleteMutationHandler } from '@/main/mutations/spaces/space-delete';
import { SpaceDescriptionUpdateMutationHandler } from '@/main/mutations/spaces/space-description-update';
import { SpaceAvatarUpdateMutationHandler } from '@/main/mutations/spaces/space-avatar-update';
import { SpaceNameUpdateMutationHandler } from '@/main/mutations/spaces/space-name-update';
import { ViewCreateMutationHandler } from '@/main/mutations/databases/view-create';
import { ViewDeleteMutationHandler } from '@/main/mutations/databases/view-delete';
import { ViewUpdateMutationHandler } from '@/main/mutations/databases/view-update';
import { ViewNameUpdateMutationHandler } from '@/main/mutations/databases/view-name-update';
import { WorkspaceCreateMutationHandler } from '@/main/mutations/workspaces/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/mutations/workspaces/workspace-update';
import { UserRoleUpdateMutationHandler } from '@/main/mutations/users/user-role-update';
import { UsersInviteMutationHandler } from '@/main/mutations/users/users-invite';
import { WorkspaceMetadataSaveMutationHandler } from '@/main/mutations/workspaces/workspace-metadata-save';
import { WorkspaceMetadataDeleteMutationHandler } from '@/main/mutations/workspaces/workspace-metadata-delete';
import { MutationHandler } from '@/main/lib/types';
import { MutationMap } from '@/shared/mutations';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  email_verify: new EmailVerifyMutationHandler(),
  view_create: new ViewCreateMutationHandler(),
  channel_create: new ChannelCreateMutationHandler(),
  channel_delete: new ChannelDeleteMutationHandler(),
  chat_create: new ChatCreateMutationHandler(),
  database_create: new DatabaseCreateMutationHandler(),
  database_delete: new DatabaseDeleteMutationHandler(),
  field_create: new FieldCreateMutationHandler(),
  field_delete: new FieldDeleteMutationHandler(),
  field_name_update: new FieldNameUpdateMutationHandler(),
  message_create: new MessageCreateMutationHandler(),
  file_delete: new FileDeleteMutationHandler(),
  folder_delete: new FolderDeleteMutationHandler(),
  entry_collaborator_create: new EntryCollaboratorCreateMutationHandler(),
  entry_collaborator_delete: new EntryCollaboratorDeleteMutationHandler(),
  entry_collaborator_update: new EntryCollaboratorUpdateMutationHandler(),
  entry_mark_opened: new EntryMarkOpenedMutationHandler(),
  entry_mark_seen: new EntryMarkSeenMutationHandler(),
  page_create: new PageCreateMutationHandler(),
  page_delete: new PageDeleteMutationHandler(),
  page_content_update: new PageContentUpdateMutationHandler(),
  message_reaction_create: new MessageReactionCreateMutationHandler(),
  message_reaction_delete: new MessageReactionDeleteMutationHandler(),
  message_mark_seen: new MessageMarkSeenMutationHandler(),
  message_delete: new MessageDeleteMutationHandler(),
  record_create: new RecordCreateMutationHandler(),
  record_delete: new RecordDeleteMutationHandler(),
  record_content_update: new RecordContentUpdateMutationHandler(),
  record_avatar_update: new RecordAvatarUpdateMutationHandler(),
  record_name_update: new RecordNameUpdateMutationHandler(),
  record_field_value_delete: new RecordFieldValueDeleteMutationHandler(),
  record_field_value_set: new RecordFieldValueSetMutationHandler(),
  select_option_create: new SelectOptionCreateMutationHandler(),
  select_option_delete: new SelectOptionDeleteMutationHandler(),
  select_option_update: new SelectOptionUpdateMutationHandler(),
  server_create: new ServerCreateMutationHandler(),
  space_create: new SpaceCreateMutationHandler(),
  space_delete: new SpaceDeleteMutationHandler(),
  user_role_update: new UserRoleUpdateMutationHandler(),
  users_invite: new UsersInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  avatar_upload: new AvatarUploadMutationHandler(),
  account_logout: new AccountLogoutMutationHandler(),
  folder_create: new FolderCreateMutationHandler(),
  file_create: new FileCreateMutationHandler(),
  file_download: new FileDownloadMutationHandler(),
  file_mark_opened: new FileMarkOpenedMutationHandler(),
  file_mark_seen: new FileMarkSeenMutationHandler(),
  file_save_temp: new FileSaveTempMutationHandler(),
  space_avatar_update: new SpaceAvatarUpdateMutationHandler(),
  space_description_update: new SpaceDescriptionUpdateMutationHandler(),
  space_name_update: new SpaceNameUpdateMutationHandler(),
  account_update: new AccountUpdateMutationHandler(),
  view_update: new ViewUpdateMutationHandler(),
  view_delete: new ViewDeleteMutationHandler(),
  view_name_update: new ViewNameUpdateMutationHandler(),
  channel_update: new ChannelUpdateMutationHandler(),
  page_update: new PageUpdateMutationHandler(),
  folder_update: new FolderUpdateMutationHandler(),
  database_update: new DatabaseUpdateMutationHandler(),
  workspace_metadata_save: new WorkspaceMetadataSaveMutationHandler(),
  workspace_metadata_delete: new WorkspaceMetadataDeleteMutationHandler(),
};
