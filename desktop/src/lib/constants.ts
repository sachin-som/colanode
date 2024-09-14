export const NodeTypes = {
  User: 'user',
  Space: 'space',
  Page: 'page',
  Channel: 'channel',
  Chat: 'chat',
  Message: 'message',
  Paragraph: 'paragraph',
  Heading1: 'heading1',
  Heading2: 'heading2',
  Heading3: 'heading3',
  Blockquote: 'blockquote',
  BulletList: 'bullet_list',
  CodeBlock: 'code_block',
  ListItem: 'list_item',
  OrderedList: 'ordered_list',
  TaskList: 'task_list',
  TaskItem: 'task_item',
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
  ViewFilter: 'view_filter',
  ViewSort: 'view_sort',
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

export const LeafNodeTypes: string[] = [
  NodeTypes.Paragraph,
  NodeTypes.Heading1,
  NodeTypes.Heading2,
  NodeTypes.Heading3,
  NodeTypes.HorizontalRule,
  NodeTypes.CodeBlock,
];

export const RootNodeTypes: string[] = [
  NodeTypes.Space,
  NodeTypes.Message,
  NodeTypes.Page,
  NodeTypes.Channel,
];

export const ViewNodeTypes: string[] = [
  NodeTypes.TableView,
  NodeTypes.BoardView,
  NodeTypes.CalendarView,
];

export const AttributeTypes = {
  Name: 'name',
  Description: 'description',
  Avatar: 'avatar',
  Color: 'color',
  DataType: 'data_type',
  Language: 'language',
  Checked: 'checked',
  HiddenField: 'hidden_field',
  FieldWidth: 'field_width',
  FieldIndex: 'field_index',
  NameWidth: 'name_width',
  FieldId: 'field_id',
  Operator: 'operator',
  Value: 'value',
  GroupBy: 'group_by',
  Direction: 'direction',
};

export const SortDirections = {
  Ascending: 'asc',
  Descending: 'desc',
};
