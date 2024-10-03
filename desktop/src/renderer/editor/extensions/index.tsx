import BoldMark from '@tiptap/extension-bold';
import DocumentNode from '@tiptap/extension-document';
import ItalicMark from '@tiptap/extension-italic';
import StrikethroughMark from '@tiptap/extension-strike';
import TextNode from '@tiptap/extension-text';
import UnderlineMark from '@tiptap/extension-underline';

import { IdExtension } from '@/renderer/editor/extensions/id';
import { BlockquoteNode } from '@/renderer/editor/extensions/blockquote';
import { BulletListNode } from '@/renderer/editor/extensions/bullet-list';
import { CodeMark } from '@/renderer/editor/extensions/code';
import { CodeBlockNode } from '@/renderer/editor/extensions/code-block';
import { ColorMark } from '@/renderer/editor/extensions/color';
import { CommanderExtension } from '@/renderer/editor/extensions/commander';
import { DeleteControlExtension } from '@/renderer/editor/extensions/delete-control';
import { DividerNode } from '@/renderer/editor/extensions/divider';
import { DropcursorExtension } from '@/renderer/editor/extensions/dropcursor';
import { Heading1Node } from '@/renderer/editor/extensions/heading1';
import { Heading2Node } from '@/renderer/editor/extensions/heading2';
import { Heading3Node } from '@/renderer/editor/extensions/heading3';
import { HighlightMark } from '@/renderer/editor/extensions/highlight';
import { LinkMark } from '@/renderer/editor/extensions/link';
import { ListItemNode } from '@/renderer/editor/extensions/list-item';
import { ListKeymapExtension } from '@/renderer/editor/extensions/list-keymap';
import { MessageNode } from '@/renderer/editor/extensions/message';
import { OrderedListNode } from '@/renderer/editor/extensions/ordered-list';
import { ParagraphNode } from '@/renderer/editor/extensions/paragraph';
import { PlaceholderExtension } from '@/renderer/editor/extensions/placeholder';
import { TabKeymapExtension } from '@/renderer/editor/extensions/tab-keymap';
import { TaskItemNode } from '@/renderer/editor/extensions/task-item';
import { TaskListNode } from '@/renderer/editor/extensions/task-list';
import { TrailingNode } from '@/renderer/editor/extensions/trailing-node';
import { PageNode } from '@/renderer/editor/extensions/page';

export {
  IdExtension,
  BoldMark,
  BlockquoteNode,
  BulletListNode,
  TabKeymapExtension,
  CodeBlockNode,
  CodeMark,
  ColorMark,
  CommanderExtension,
  DeleteControlExtension,
  DividerNode,
  DocumentNode,
  Heading1Node,
  Heading2Node,
  Heading3Node,
  HighlightMark,
  ItalicMark,
  LinkMark,
  ListItemNode,
  ListKeymapExtension,
  MessageNode,
  PlaceholderExtension,
  OrderedListNode,
  ParagraphNode,
  StrikethroughMark,
  TaskItemNode,
  TaskListNode,
  TextNode,
  TrailingNode,
  UnderlineMark,
  DropcursorExtension,
  PageNode,
};
