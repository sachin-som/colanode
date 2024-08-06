export const NodeTypes = {
  Space: 'space',
  Page: 'page',
  Channel: 'channel',
  Message: 'message',
  Paragraph: 'paragraph',
  Heading: 'heading',
  Blockquote: 'blockquote',
  BulletList: 'bulletList',
  CodeBlock: 'codeBlock',
  ListItem: 'listItem',
  OrderedList: 'orderedList',
  TaskList: 'taskList',
  TaskItem: 'taskItem',
  Divider: 'divider',
};

export const LeafNodeTypes: string[] = [
  NodeTypes.Paragraph,
  NodeTypes.Heading,
  NodeTypes.Blockquote,
  NodeTypes.Divider,
  NodeTypes.CodeBlock,
];
