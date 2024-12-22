import { ChannelAttributes, channelModel } from './channel';
import { ChatAttributes, chatModel } from './chat';
import { NodeModel } from './core';
import { DatabaseAttributes, databaseModel } from './database';
import { FolderAttributes, folderModel } from './folder';
import { MessageAttributes, messageModel } from './message';
import { PageAttributes, pageModel } from './page';
import { RecordAttributes, recordModel } from './record';
import { SpaceAttributes, spaceModel } from './space';

type NodeBase = {
  id: string;
  parentId: string;
  rootId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  transactionId: string;
};

export type CollaborationBase = {
  userId: string;
  nodeId: string;
  type: NodeType;
  createdAt: string;
  createdBy: string | null;
  removedAt: string | null;
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

export type NodeType =
  | 'channel'
  | 'chat'
  | 'database'
  | 'folder'
  | 'message'
  | 'page'
  | 'record'
  | 'space';

export type NodeAttributes =
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FolderAttributes
  | MessageAttributes
  | PageAttributes
  | RecordAttributes;

export type Node =
  | ChannelNode
  | ChatNode
  | DatabaseNode
  | FolderNode
  | MessageNode
  | PageNode
  | RecordNode
  | SpaceNode;

class Registry {
  private models: Map<string, NodeModel> = new Map();

  constructor() {
    this.models.set('channel', channelModel);
    this.models.set('chat', chatModel);
    this.models.set('database', databaseModel);
    this.models.set('folder', folderModel);
    this.models.set('message', messageModel);
    this.models.set('page', pageModel);
    this.models.set('record', recordModel);
    this.models.set('space', spaceModel);
  }

  getModel(type: string): NodeModel {
    const model = this.models.get(type);
    if (!model) {
      throw new Error(`Model for type ${type} not found`);
    }

    return model;
  }
}

export const registry = new Registry();
