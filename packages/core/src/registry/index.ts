import { ChannelAttributes, channelModel } from './channel';
import { ChatAttributes, chatModel } from './chat';
import { EntryModel } from './core';
import { DatabaseAttributes, databaseModel } from './database';
import { FolderAttributes, folderModel } from './folder';
import { PageAttributes, pageModel } from './page';
import { RecordAttributes, recordModel } from './record';
import { SpaceAttributes, spaceModel } from './space';

type EntryBase = {
  id: string;
  parentId: string;
  rootId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  transactionId: string;
};

export type ChannelEntry = EntryBase & {
  type: 'channel';
  attributes: ChannelAttributes;
};

export type ChatEntry = EntryBase & {
  type: 'chat';
  attributes: ChatAttributes;
};

export type DatabaseEntry = EntryBase & {
  type: 'database';
  attributes: DatabaseAttributes;
};

export type FolderEntry = EntryBase & {
  type: 'folder';
  attributes: FolderAttributes;
};

export type PageEntry = EntryBase & {
  type: 'page';
  attributes: PageAttributes;
};

export type RecordEntry = EntryBase & {
  type: 'record';
  attributes: RecordAttributes;
};

export type SpaceEntry = EntryBase & {
  type: 'space';
  attributes: SpaceAttributes;
};

export type EntryType = EntryAttributes['type'];

export type EntryAttributes =
  | SpaceAttributes
  | DatabaseAttributes
  | ChannelAttributes
  | ChatAttributes
  | FolderAttributes
  | PageAttributes
  | RecordAttributes;

export type Entry =
  | ChannelEntry
  | ChatEntry
  | DatabaseEntry
  | FolderEntry
  | PageEntry
  | RecordEntry
  | SpaceEntry;

class Registry {
  private models: Map<string, EntryModel> = new Map();

  constructor() {
    this.models.set('channel', channelModel);
    this.models.set('chat', chatModel);
    this.models.set('database', databaseModel);
    this.models.set('folder', folderModel);
    this.models.set('page', pageModel);
    this.models.set('record', recordModel);
    this.models.set('space', spaceModel);
  }

  getModel(type: string): EntryModel {
    const model = this.models.get(type);
    if (!model) {
      throw new Error(`Model for type ${type} not found`);
    }

    return model;
  }
}

export const registry = new Registry();
