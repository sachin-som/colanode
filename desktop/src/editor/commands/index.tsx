import { BlockquoteCommand } from '@/editor/commands/blockquote';
import { BulletListCommand } from '@/editor/commands/bullet-list';
import { CodeBlockCommand } from '@/editor/commands/code-block';
import { DividerCommand } from '@/editor/commands/divider';
import { Heading1Command } from '@/editor/commands/heading1';
import { Heading2Command } from '@/editor/commands/heading2';
import { Heading3Command } from '@/editor/commands/heading3';
import { OrderedListCommand } from '@/editor/commands/ordered-list';
import { ParagraphCommand } from '@/editor/commands/paragraph';
import { TodoCommand } from '@/editor/commands/todo';
import { PageCommand } from '@/editor/commands/page';
import { EditorCommand, EditorCommandProps } from '@/types/editor';

export type { EditorCommand, EditorCommandProps };

export {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  ParagraphCommand,
  DividerCommand,
  TodoCommand,
  PageCommand,
};
