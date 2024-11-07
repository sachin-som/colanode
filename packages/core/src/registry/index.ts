import { ChannelAttributes, channelModel } from './channel';
import { NodeModel } from './core';
import { PageAttributes, pageModel } from './page';
import { ChatAttributes, chatModel } from './chat';
import { SpaceAttributes, spaceModel } from './space';
import { UserAttributes, userModel } from './user';
import { MessageAttributes, messageModel } from './message';
import { DatabaseAttributes, databaseModel } from './database';
import { FileAttributes, fileModel } from './file';
import { FolderAttributes, folderModel } from './folder';
import { RecordAttributes, recordModel } from './record';

export const registry: Record<string, NodeModel> = {
  channel: channelModel,
  chat: chatModel,
  database: databaseModel,
  file: fileModel,
  folder: folderModel,
  message: messageModel,
  page: pageModel,
  record: recordModel,
  space: spaceModel,
  user: userModel,
};

type NodeBase = {
  id: string;
  parentId: string | null;
  index: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type ChannelNode = NodeBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatNode = NodeBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseNode = NodeBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type FileNode = NodeBase & {
  type: 'file';
  attributes: FileAttributes;
};

export type FolderNode = NodeBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type MessageNode = NodeBase & {
  type: 'message';
  attributes: MessageAttributes;
};

export type PageNode = NodeBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordNode = NodeBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceNode = NodeBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type UserNode = NodeBase & {
  type: 'user';
  attributes: UserAttributes;
};

export type Node =
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

export type NodeAttributes =
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
