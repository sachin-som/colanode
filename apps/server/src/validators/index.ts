import { NodeTypes } from '@colanode/core';
import { Validator } from '@/types/validators';
import { ChannelValidator } from '@/validators/channel-validator';
import { ChatValidator } from '@/validators/chat-validator';
import { DatabaseValidator } from '@/validators/database-validator';
import { FileValidator } from '@/validators/file-validator';
import { FolderValidator } from '@/validators/folder-validator';
import { MessageValidator } from '@/validators/message-validator';
import { PageValidator } from '@/validators/page-validator';
import { RecordValidator } from '@/validators/record-validator';
import { SpaceValidator } from '@/validators/space-validator';

const validators: Record<string, Validator> = {
  [NodeTypes.Channel]: new ChannelValidator(),
  [NodeTypes.Chat]: new ChatValidator(),
  [NodeTypes.Database]: new DatabaseValidator(),
  [NodeTypes.File]: new FileValidator(),
  [NodeTypes.Folder]: new FolderValidator(),
  [NodeTypes.Message]: new MessageValidator(),
  [NodeTypes.Page]: new PageValidator(),
  [NodeTypes.Record]: new RecordValidator(),
  [NodeTypes.Space]: new SpaceValidator(),
};

export const getValidator = (type: string): Validator | undefined => {
  return validators[type];
};
