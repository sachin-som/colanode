import { Entry, Message } from '@colanode/core';

import { AppMetadata } from '@/shared/types/apps';
import { EntryInteraction } from '@/shared/types/entries';
import {
  MessageInteraction,
  MessageNode,
  MessageReaction,
} from '@/shared/types/messages';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { Workspace, WorkspaceMetadata } from '@/shared/types/workspaces';
import { User } from '@/shared/types/users';
import { File, FileInteraction, FileState } from '@/shared/types/files';

export type UserCreatedEvent = {
  type: 'user_created';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserUpdatedEvent = {
  type: 'user_updated';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type UserDeletedEvent = {
  type: 'user_deleted';
  accountId: string;
  workspaceId: string;
  user: User;
};

export type EntryCreatedEvent = {
  type: 'entry_created';
  accountId: string;
  workspaceId: string;
  entry: Entry;
};

export type EntryUpdatedEvent = {
  type: 'entry_updated';
  accountId: string;
  workspaceId: string;
  entry: Entry;
};

export type EntryDeletedEvent = {
  type: 'entry_deleted';
  accountId: string;
  workspaceId: string;
  entry: Entry;
};

export type EntryInteractionUpdatedEvent = {
  type: 'entry_interaction_updated';
  accountId: string;
  workspaceId: string;
  entryInteraction: EntryInteraction;
};

export type MessageCreatedEvent = {
  type: 'message_created';
  accountId: string;
  workspaceId: string;
  message: MessageNode;
};

export type MessageUpdatedEvent = {
  type: 'message_updated';
  accountId: string;
  workspaceId: string;
  message: MessageNode;
};

export type MessageDeletedEvent = {
  type: 'message_deleted';
  accountId: string;
  workspaceId: string;
  message: MessageNode;
};

export type MessageReactionCreatedEvent = {
  type: 'message_reaction_created';
  accountId: string;
  workspaceId: string;
  messageReaction: MessageReaction;
};

export type MessageReactionDeletedEvent = {
  type: 'message_reaction_deleted';
  accountId: string;
  workspaceId: string;
  messageReaction: MessageReaction;
};

export type MessageInteractionUpdatedEvent = {
  type: 'message_interaction_updated';
  accountId: string;
  workspaceId: string;
  messageInteraction: MessageInteraction;
};

export type FileCreatedEvent = {
  type: 'file_created';
  accountId: string;
  workspaceId: string;
  file: File;
};

export type FileUpdatedEvent = {
  type: 'file_updated';
  accountId: string;
  workspaceId: string;
  file: File;
};

export type FileDeletedEvent = {
  type: 'file_deleted';
  accountId: string;
  workspaceId: string;
  file: File;
};

export type FileStateCreatedEvent = {
  type: 'file_state_created';
  accountId: string;
  workspaceId: string;
  fileState: FileState;
};

export type FileStateUpdatedEvent = {
  type: 'file_state_updated';
  accountId: string;
  workspaceId: string;
  fileState: FileState;
};

export type FileStateDeletedEvent = {
  type: 'file_state_deleted';
  accountId: string;
  workspaceId: string;
  fileState: FileState;
};

export type FileInteractionUpdatedEvent = {
  type: 'file_interaction_updated';
  accountId: string;
  workspaceId: string;
  fileInteraction: FileInteraction;
};

export type AccountCreatedEvent = {
  type: 'account_created';
  account: Account;
};

export type AccountUpdatedEvent = {
  type: 'account_updated';
  account: Account;
};

export type AccountDeletedEvent = {
  type: 'account_deleted';
  account: Account;
};

export type WorkspaceCreatedEvent = {
  type: 'workspace_created';
  workspace: Workspace;
};

export type WorkspaceUpdatedEvent = {
  type: 'workspace_updated';
  workspace: Workspace;
};

export type WorkspaceDeletedEvent = {
  type: 'workspace_deleted';
  workspace: Workspace;
};

export type ServerCreatedEvent = {
  type: 'server_created';
  server: Server;
};

export type ServerUpdatedEvent = {
  type: 'server_updated';
  server: Server;
};

export type QueryResultUpdatedEvent = {
  type: 'query_result_updated';
  id: string;
  result: unknown;
};

export type RadarDataUpdatedEvent = {
  type: 'radar_data_updated';
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  accountId: string;
  workspaceId: string;
  entryId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration_deleted';
  accountId: string;
  workspaceId: string;
  entryId: string;
};

export type ServerAvailabilityChangedEvent = {
  type: 'server_availability_changed';
  server: Server;
  isAvailable: boolean;
};

export type AccountConnectionOpenedEvent = {
  type: 'account_connection_opened';
  accountId: string;
};

export type AccountConnectionClosedEvent = {
  type: 'account_connection_closed';
  accountId: string;
};

export type AccountConnectionMessageEvent = {
  type: 'account_connection_message';
  accountId: string;
  message: Message;
};

export type AppMetadataUpdatedEvent = {
  type: 'app_metadata_updated';
  metadata: AppMetadata;
};

export type AppMetadataDeletedEvent = {
  type: 'app_metadata_deleted';
  metadata: AppMetadata;
};

export type WorkspaceMetadataUpdatedEvent = {
  type: 'workspace_metadata_updated';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type WorkspaceMetadataDeletedEvent = {
  type: 'workspace_metadata_deleted';
  accountId: string;
  workspaceId: string;
  metadata: WorkspaceMetadata;
};

export type Event =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | EntryCreatedEvent
  | EntryUpdatedEvent
  | EntryDeletedEvent
  | EntryInteractionUpdatedEvent
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | MessageReactionCreatedEvent
  | MessageReactionDeletedEvent
  | MessageInteractionUpdatedEvent
  | AccountCreatedEvent
  | AccountUpdatedEvent
  | AccountDeletedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | ServerCreatedEvent
  | ServerUpdatedEvent
  | FileCreatedEvent
  | FileUpdatedEvent
  | FileDeletedEvent
  | FileStateCreatedEvent
  | FileStateUpdatedEvent
  | FileStateDeletedEvent
  | FileInteractionUpdatedEvent
  | QueryResultUpdatedEvent
  | RadarDataUpdatedEvent
  | ServerAvailabilityChangedEvent
  | CollaborationCreatedEvent
  | CollaborationDeletedEvent
  | AccountConnectionOpenedEvent
  | AccountConnectionClosedEvent
  | AccountConnectionMessageEvent
  | AppMetadataUpdatedEvent
  | AppMetadataDeletedEvent
  | WorkspaceMetadataUpdatedEvent
  | WorkspaceMetadataDeletedEvent;
