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

export const EditorNodeTypes = {
  Paragraph: 'paragraph',
  Heading1: 'heading1',
  Heading2: 'heading2',
  Heading3: 'heading3',
  Blockquote: 'blockquote',
  BulletList: 'bulletList',
  CodeBlock: 'codeBlock',
  ListItem: 'listItem',
  OrderedList: 'orderedList',
  TaskList: 'taskList',
  TaskItem: 'taskItem',
  HorizontalRule: 'horizontalRule',
  Page: 'page',
};

export const ViewNodeTypes: string[] = [
  NodeTypes.TableView,
  NodeTypes.BoardView,
  NodeTypes.CalendarView,
];

export const SortDirections = {
  Ascending: 'asc',
  Descending: 'desc',
};

export const NodeRole = {
  Owner: 'owner',
  Admin: 'admin',
  Collaborator: 'collaborator',
  Viewer: 'viewer',
};
