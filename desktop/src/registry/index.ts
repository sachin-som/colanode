import { ChannelRegistry } from '@/registry/channel';
import { NodeRegistry } from '@/registry/core';
import { PageRegistry } from '@/registry/page';
import { ChatRegistry } from '@/registry/chat';
import { SpaceRegistry } from '@/registry/space';
import { UserRegistry } from '@/registry/user';
import { MessageRegistry } from '@/registry/message';
import { DatabaseRegistry } from '@/registry/database';
import { FileRegistry } from '@/registry/file';
import { FolderRegistry } from '@/registry/folder';
import { RecordRegistry } from '@/registry/record';

export * from '@/registry/channel';
export * from '@/registry/core';
export * from '@/registry/page';
export * from '@/registry/chat';
export * from '@/registry/space';
export * from '@/registry/user';
export * from '@/registry/message';
export * from '@/registry/database';
export * from '@/registry/file';
export * from '@/registry/folder';
export * from '@/registry/record';
export * from '@/registry/block';
export * from '@/registry/fields';

export const registryMap: Record<string, NodeRegistry> = {
  channel: ChannelRegistry,
  chat: ChatRegistry,
  database: DatabaseRegistry,
  file: FileRegistry,
  folder: FolderRegistry,
  message: MessageRegistry,
  page: PageRegistry,
  record: RecordRegistry,
  space: SpaceRegistry,
  user: UserRegistry,
};
