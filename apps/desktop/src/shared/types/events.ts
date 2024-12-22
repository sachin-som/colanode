import { Node } from '@colanode/core';

import { Account } from '@/shared/types/accounts';
import { Interaction } from '@/shared/types/interactions';
import { Server } from '@/shared/types/servers';
import { Workspace } from '@/shared/types/workspaces';
import { User } from '@/shared/types/users';
import { File, FileState } from '@/shared/types/files';

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

export type NodeCreatedEvent = {
  type: 'node_created';
  userId: string;
  node: Node;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  userId: string;
  node: Node;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  userId: string;
  node: Node;
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
  mutationId: string;
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  userId: string;
  nodeId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration_deleted';
  userId: string;
  nodeId: string;
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

export type InteractionEventCreatedEvent = {
  type: 'interaction_event_created';
  userId: string;
  nodeId: string;
};

export type InteractionUpdatedEvent = {
  type: 'interaction_updated';
  userId: string;
  interaction: Interaction;
};

export type Event =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
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
  | QueryResultUpdatedEvent
  | RadarDataUpdatedEvent
  | MutationCreatedEvent
  | ServerAvailabilityChangedEvent
  | SocketConnectionOpenedEvent
  | CollaborationCreatedEvent
  | CollaborationDeletedEvent
  | InteractionEventCreatedEvent
  | InteractionUpdatedEvent;
