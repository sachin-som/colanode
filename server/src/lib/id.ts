import { monotonicFactory } from 'ulid';

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
  Device = 'dv',
  Change = 'cd',
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
