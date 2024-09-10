import BoldMark from '@tiptap/extension-bold';
import DocumentNode from '@tiptap/extension-document';
import ItalicMark from '@tiptap/extension-italic';
import StrikethroughMark from '@tiptap/extension-strike';
import TextNode from '@tiptap/extension-text';
import UnderlineMark from '@tiptap/extension-underline';

import { IdExtension } from '@/editor/extensions/id';
import { BlockquoteNode } from '@/editor/extensions/blockquote';
import { BulletListNode } from '@/editor/extensions/bullet-list';
import { CodeMark } from '@/editor/extensions/code';
import { CodeBlockNode } from '@/editor/extensions/code-block';
import { ColorMark } from '@/editor/extensions/color';
import { CommanderExtension } from '@/editor/extensions/commander';
import { DeleteControlExtension } from '@/editor/extensions/delete-control';
import { DividerNode } from '@/editor/extensions/divider';
import { DropcursorExtension } from '@/editor/extensions/dropcursor';
import { Heading1Node } from '@/editor/extensions/heading1';
import { Heading2Node } from '@/editor/extensions/heading2';
import { Heading3Node } from '@/editor/extensions/heading3';
import { HighlightMark } from '@/editor/extensions/highlight';
import { LinkMark } from '@/editor/extensions/link';
import { ListItemNode } from '@/editor/extensions/list-item';
import { ListKeymapExtension } from '@/editor/extensions/list-keymap';
import { MessageNode } from '@/editor/extensions/message';
import { OrderedListNode } from '@/editor/extensions/ordered-list';
import { ParagraphNode } from '@/editor/extensions/paragraph';
import { PlaceholderExtension } from '@/editor/extensions/placeholder';
import { TabKeymapExtension } from '@/editor/extensions/tab-keymap';
import { TaskItemNode } from '@/editor/extensions/task-item';
import { TaskListNode } from '@/editor/extensions/task-list';
import { TrailingNode } from '@/editor/extensions/trailing-node';
import { PageNode } from '@/editor/extensions/page';

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
