import { z } from 'zod';

import { ChannelAttributes, channelAttributesSchema } from './channel';
import { ChatAttributes, chatAttributesSchema } from './chat';
import { DatabaseAttributes, databaseAttributesSchema } from './database';
import { FolderAttributes, folderAttributesSchema } from './folder';
import { PageAttributes, pageAttributesSchema } from './page';
import { RecordAttributes, recordAttributesSchema } from './record';
import { SpaceAttributes, spaceAttributesSchema } from './space';

type EntryBase = {
  id: string;
  parentId: string | null;
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

export const entryAttributesSchema = z.discriminatedUnion('type', [
  channelAttributesSchema,
  chatAttributesSchema,
  databaseAttributesSchema,
  folderAttributesSchema,
  pageAttributesSchema,
  recordAttributesSchema,
  spaceAttributesSchema,
]);
