import { monotonicFactory } from 'ulid';
import { NodeTypes } from '@/lib/constants';

const ulid = monotonicFactory();

export enum IdType {
  Account = 'ac',
  Workspace = 'wc',
  User = 'us',
  Version = 've',
  Mutation = 'mu',
  Space = 'sp',
  Page = 'pg',
  Channel = 'ch',
  Chat = 'ct',
  Node = 'nd',
  Message = 'ms',
  Subscriber = 'sb',
  Paragraph = 'pa',
  Heading1 = 'h1',
  Heading2 = 'h2',
  Heading3 = 'h3',
  Blockquote = 'bq',
  CodeBlock = 'cb',
  ListItem = 'li',
  OrderedList = 'ol',
  BulletList = 'bl',
  TaskList = 'tl',
  TaskItem = 'ti',
  HorizontalRule = 'hr',
  Database = 'db',
  DatabaseReplica = 'dr',
  Record = 'rc',
  Folder = 'fl',
  TableView = 'tv',
  BoardView = 'bv',
  CalendarView = 'cv',
  Field = 'fi',
  SelectOption = 'so',
  ViewFilter = 'vf',
  ViewSort = 'vs',
  Query = 'qu',
  Emoji = 'em',
  Avatar = 'av',
  Icon = 'ic',
  File = 'fi',
  FilePlaceholder = 'fp',
}

export const generateId = (type: IdType): string => {
  return ulid().toLowerCase() + type;
};

export const isIdOfType = (id: string, type: IdType): boolean => {
  return id.endsWith(type);
};

export const getIdType = (id: string): IdType => {
  return id.substring(id.length - 2) as IdType;
};

export const getIdTypeFromNode = (nodeType: string): IdType => {
  switch (nodeType) {
    case NodeTypes.User:
      return IdType.User;
    case NodeTypes.Space:
      return IdType.Space;
    case NodeTypes.Page:
      return IdType.Page;
    case NodeTypes.Channel:
      return IdType.Channel;
    case NodeTypes.Message:
      return IdType.Message;
    case NodeTypes.HorizontalRule:
      return IdType.HorizontalRule;
    case NodeTypes.Database:
      return IdType.Database;
    case NodeTypes.DatabaseReplica:
      return IdType.DatabaseReplica;
    case NodeTypes.Record:
      return IdType.Record;
    case NodeTypes.Folder:
      return IdType.Folder;
    case NodeTypes.TableView:
      return IdType.TableView;
    case NodeTypes.BoardView:
      return IdType.BoardView;
    case NodeTypes.CalendarView:
      return IdType.CalendarView;
    case NodeTypes.Field:
      return IdType.Field;
    case NodeTypes.SelectOption:
      return IdType.SelectOption;
    default:
      return IdType.Node;
  }
};
