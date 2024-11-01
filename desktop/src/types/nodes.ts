import {
  ChannelAttributes,
  ChatAttributes,
  DatabaseAttributes,
  FileAttributes,
  FolderAttributes,
  MessageAttributes,
  PageAttributes,
  RecordAttributes,
  SpaceAttributes,
  UserAttributes,
} from '@/registry';

type LocalNodeBase = {
  id: string;
  parentId: string | null;
  index: string | null;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type ChannelNode = LocalNodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatNode = LocalNodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseNode = LocalNodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type FileNode = LocalNodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type FolderNode = LocalNodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type MessageNode = LocalNodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type PageNode = LocalNodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordNode = LocalNodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceNode = LocalNodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type UserNode = LocalNodeBase & {
  type: 'user';
  attributes: UserAttributes;
};

export type LocalNode =
  | ChannelNode
  | ChatNode
  | DatabaseNode
  | FileNode
  | FolderNode
  | MessageNode
  | PageNode
  | RecordNode
  | SpaceNode
  | UserNode;

export type LocalNodeAttributes =
  | UserAttributes
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FileAttributes
  | FolderAttributes
  | MessageAttributes
  | PageAttributes
  | RecordAttributes;

export type ServerNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  attributes: LocalNodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
};

export type NodeCollaboratorsWrapper = {
  direct: NodeCollaborator[];
  inherit: InheritNodeCollaboratorsGroup[];
};

export type InheritNodeCollaboratorsGroup = {
  id: string;
  name: string;
  avatar: string | null;
  collaborators: NodeCollaborator[];
};

export type NodeCollaborator = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
};
