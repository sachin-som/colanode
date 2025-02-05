import { Message } from '@colanode/core';

import { AppMetadata } from '@/shared/types/apps';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { Workspace, WorkspaceMetadata } from '@/shared/types/workspaces';
import { User } from '@/shared/types/users';
import { File } from '@/shared/types/files';
import { LocalNode, NodeInteraction, NodeReaction } from '@/shared/types/nodes';

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

export type NodeCreatedEvent = {
  type: 'node_created';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  accountId: string;
  workspaceId: string;
  node: LocalNode;
};

export type NodeInteractionUpdatedEvent = {
  type: 'node_interaction_updated';
  accountId: string;
  workspaceId: string;
  nodeInteraction: NodeInteraction;
};

export type NodeReactionCreatedEvent = {
  type: 'node_reaction_created';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
};

export type NodeReactionDeletedEvent = {
  type: 'node_reaction_deleted';
  accountId: string;
  workspaceId: string;
  nodeReaction: NodeReaction;
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
  nodeId: string;
};

export type CollaborationDeletedEvent = {
  type: 'collaboration_deleted';
  accountId: string;
  workspaceId: string;
  nodeId: string;
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
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
  | NodeInteractionUpdatedEvent
  | NodeReactionCreatedEvent
  | NodeReactionDeletedEvent
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
