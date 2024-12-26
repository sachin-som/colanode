import { Entry } from '@colanode/core';

import { EntryInteraction } from '@/shared/types/entries';
import {
  MessageInteraction,
  MessageNode,
  MessageReaction,
} from '@/shared/types/messages';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { Workspace } from '@/shared/types/workspaces';
import { User } from '@/shared/types/users';
import { File, FileInteraction, FileState } from '@/shared/types/files';

export type UserCreatedEvent = {
  type: 'user_created';
  userId: string;
  user: User;
};

export type UserUpdatedEvent = {
  type: 'user_updated';
  userId: string;
  user: User;
};

export type UserDeletedEvent = {
  type: 'user_deleted';
  userId: string;
  user: User;
};

export type EntryCreatedEvent = {
  type: 'entry_created';
  userId: string;
  entry: Entry;
};

export type EntryUpdatedEvent = {
  type: 'entry_updated';
  userId: string;
  entry: Entry;
};

export type EntryDeletedEvent = {
  type: 'entry_deleted';
  userId: string;
  entry: Entry;
};

export type EntryInteractionUpdatedEvent = {
  type: 'entry_interaction_updated';
  userId: string;
  entryInteraction: EntryInteraction;
};

export type MessageCreatedEvent = {
  type: 'message_created';
  userId: string;
  message: MessageNode;
};

export type MessageUpdatedEvent = {
  type: 'message_updated';
  userId: string;
  message: MessageNode;
};

export type MessageDeletedEvent = {
  type: 'message_deleted';
  userId: string;
  message: MessageNode;
};

export type MessageReactionCreatedEvent = {
  type: 'message_reaction_created';
  userId: string;
  messageReaction: MessageReaction;
};

export type MessageReactionDeletedEvent = {
  type: 'message_reaction_deleted';
  userId: string;
  messageReaction: MessageReaction;
};

export type MessageInteractionUpdatedEvent = {
  type: 'message_interaction_updated';
  userId: string;
  messageInteraction: MessageInteraction;
};

export type FileCreatedEvent = {
  type: 'file_created';
  userId: string;
  file: File;
};

export type FileUpdatedEvent = {
  type: 'file_updated';
  userId: string;
  file: File;
};

export type FileDeletedEvent = {
  type: 'file_deleted';
  userId: string;
  file: File;
};

export type FileStateCreatedEvent = {
  type: 'file_state_created';
  userId: string;
  fileState: FileState;
};

export type FileStateUpdatedEvent = {
  type: 'file_state_updated';
  userId: string;
  fileState: FileState;
};

export type FileStateDeletedEvent = {
  type: 'file_state_deleted';
  userId: string;
  fileState: FileState;
};

export type FileInteractionUpdatedEvent = {
  type: 'file_interaction_updated';
  userId: string;
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

export type MutationCreatedEvent = {
  type: 'mutation_created';
  userId: string;
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  userId: string;
  entryId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration_deleted';
  userId: string;
  entryId: string;
};

export type ServerAvailabilityChangedEvent = {
  type: 'server_availability_changed';
  server: Server;
  isAvailable: boolean;
};

export type SocketConnectionOpenedEvent = {
  type: 'socket_connection_opened';
  accountId: string;
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
  | MutationCreatedEvent
  | ServerAvailabilityChangedEvent
  | SocketConnectionOpenedEvent
  | CollaborationCreatedEvent
  | CollaborationDeletedEvent;
