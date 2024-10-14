export const PostgresOperation = {
  CREATE: 'c',
  UPDATE: 'u',
  DELETE: 'd',
} as const;

export const NodeTypes = {
  User: 'user',
  Space: 'space',
  Page: 'page',
  Channel: 'channel',
  Chat: 'chat',
  Message: 'message',
  HorizontalRule: 'horizontal_rule',
  Database: 'database',
  DatabaseReplica: 'database_replica',
  Record: 'record',
  Folder: 'folder',
  TableView: 'table_view',
  BoardView: 'board_view',
  CalendarView: 'calendar_view',
  Field: 'field',
  SelectOption: 'select_option',
};
