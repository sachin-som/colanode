import { NodeTypes } from '@/lib/constants';
import { Validator } from '@/types/validators';
import { BoardViewValidator } from '@/validators/board-view-validator';
import { CalendarViewValidator } from '@/validators/calendar-view-validator';
import { ChannelValidator } from '@/validators/channel-validator';
import { ChatValidator } from '@/validators/chat-validator';
import { DatabaseValidator } from '@/validators/database-validator';
import { FieldValidator } from '@/validators/field-validator';
import { FileValidator } from '@/validators/file-validator';
import { FolderValidator } from '@/validators/folder-validator';
import { MessageValidator } from '@/validators/message-validator';
import { PageValidator } from '@/validators/page-validator';
import { RecordValidator } from '@/validators/record-validator';
import { SelectOptionValidator } from '@/validators/select-option-validator';
import { SpaceValidator } from '@/validators/space-validator';
import { TableViewValidator } from '@/validators/table-view-validator';

const validators: Record<string, Validator> = {
  [NodeTypes.BoardView]: new BoardViewValidator(),
  [NodeTypes.CalendarView]: new CalendarViewValidator(),
  [NodeTypes.Channel]: new ChannelValidator(),
  [NodeTypes.Chat]: new ChatValidator(),
  [NodeTypes.Database]: new DatabaseValidator(),
  [NodeTypes.Field]: new FieldValidator(),
  [NodeTypes.File]: new FileValidator(),
  [NodeTypes.Folder]: new FolderValidator(),
  [NodeTypes.Message]: new MessageValidator(),
  [NodeTypes.Page]: new PageValidator(),
  [NodeTypes.Record]: new RecordValidator(),
  [NodeTypes.SelectOption]: new SelectOptionValidator(),
  [NodeTypes.Space]: new SpaceValidator(),
  [NodeTypes.TableView]: new TableViewValidator(),
};

export const getValidator = (type: string): Validator | undefined => {
  return validators[type];
};
