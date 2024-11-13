import { BlockquoteCommand } from '@/renderer/editor/commands/blockquote';
import { BulletListCommand } from '@/renderer/editor/commands/bullet-list';
import { CodeBlockCommand } from '@/renderer/editor/commands/code-block';
import { DividerCommand } from '@/renderer/editor/commands/divider';
import { Heading1Command } from '@/renderer/editor/commands/heading1';
import { Heading2Command } from '@/renderer/editor/commands/heading2';
import { Heading3Command } from '@/renderer/editor/commands/heading3';
import { OrderedListCommand } from '@/renderer/editor/commands/ordered-list';
import { ParagraphCommand } from '@/renderer/editor/commands/paragraph';
import { TodoCommand } from '@/renderer/editor/commands/todo';
import { PageCommand } from '@/renderer/editor/commands/page';
import { FolderCommand } from '@/renderer/editor/commands/folder';
import { FileCommand } from '@/renderer/editor/commands/file';
import { EditorCommand, EditorCommandProps } from '@/shared/types/editor';

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
  FolderCommand,
  FileCommand,
};
