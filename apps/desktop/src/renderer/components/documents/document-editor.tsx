import '@/renderer/styles/editor.css';

import {
  EditorContent,
  FocusPosition,
  JSONContent,
  useEditor,
} from '@tiptap/react';
import { debounce, isEqual } from 'lodash-es';
import React from 'react';

import { useWorkspace } from '@/renderer/contexts/workspace';
import {
  BlockquoteCommand,
  BulletListCommand,
  CodeBlockCommand,
  DividerCommand,
  FileCommand,
  FolderCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  OrderedListCommand,
  PageCommand,
  ParagraphCommand,
  TodoCommand,
  DatabaseCommand,
} from '@/renderer/editor/commands';
import {
  BlockquoteNode,
  BoldMark,
  BulletListNode,
  CodeBlockNode,
  CodeMark,
  ColorMark,
  CommanderExtension,
  DeleteControlExtension,
  DividerNode,
  DocumentNode,
  DropcursorExtension,
  FileNode,
  FolderNode,
  Heading1Node,
  Heading2Node,
  Heading3Node,
  HighlightMark,
  IdExtension,
  ItalicMark,
  LinkMark,
  ListItemNode,
  ListKeymapExtension,
  OrderedListNode,
  PageNode,
  ParagraphNode,
  PlaceholderExtension,
  StrikethroughMark,
  TabKeymapExtension,
  TaskItemNode,
  TaskListNode,
  TextNode,
  TrailingNode,
  UnderlineMark,
  DatabaseNode,
} from '@/renderer/editor/extensions';
import { ToolbarMenu, ActionMenu } from '@/renderer/editor/menus';
import {
  restoreRelativeSelection,
  getRelativeSelection,
} from '@/shared/lib/editor';

interface DocumentEditorProps {
  documentId: string;
  rootId: string;
  content: JSONContent;
  transactionId: string;
  canEdit: boolean;
  onUpdate: (before: JSONContent, after: JSONContent) => void;
  autoFocus?: FocusPosition;
}

export const DocumentEditor = ({
  documentId,
  rootId,
  content,
  transactionId,
  canEdit,
  onUpdate,
  autoFocus,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();

  const hasPendingChanges = React.useRef(false);
  const transactionIdRef = React.useRef(transactionId);
  const contentRef = React.useRef(content);

  const debouncedSave = React.useMemo(
    () =>
      debounce((content: JSONContent) => {
        const before = contentRef.current;
        const after = content;

        contentRef.current = content;
        hasPendingChanges.current = false;

        onUpdate(before, after);
      }, 500),
    [onUpdate]
  );

  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        PageNode,
        FolderNode,
        FileNode.configure({
          context: {
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            documentId,
            rootId,
          },
        }),
        TextNode,
        ParagraphNode,
        Heading1Node,
        Heading2Node,
        Heading3Node,
        BlockquoteNode,
        BulletListNode,
        CodeBlockNode,
        TabKeymapExtension,
        ListItemNode,
        ListKeymapExtension,
        OrderedListNode,
        PlaceholderExtension.configure({
          message: "Write something or '/' for commands",
        }),
        TaskListNode,
        TaskItemNode,
        DividerNode,
        TrailingNode,
        LinkMark,
        DeleteControlExtension,
        DropcursorExtension,
        DatabaseNode,
        CommanderExtension.configure({
          commands: [
            ParagraphCommand,
            PageCommand,
            BlockquoteCommand,
            Heading1Command,
            Heading2Command,
            Heading3Command,
            BulletListCommand,
            CodeBlockCommand,
            OrderedListCommand,
            DatabaseCommand,
            DividerCommand,
            TodoCommand,
            FileCommand,
            FolderCommand,
          ],
          context: {
            documentId,
            accountId: workspace.accountId,
            workspaceId: workspace.id,
            rootId,
          },
        }),
        BoldMark,
        ItalicMark,
        UnderlineMark,
        StrikethroughMark,
        CodeMark,
        ColorMark,
        HighlightMark,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
          spellCheck: 'false',
        },
      },
      content: content,
      editable: canEdit,
      shouldRerenderOnTransaction: false,
      autofocus: autoFocus,
      onUpdate: async ({ editor, transaction }) => {
        if (transaction.docChanged) {
          hasPendingChanges.current = true;
          debouncedSave(editor.getJSON());
        }
      },
    },
    [documentId]
  );

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    if (hasPendingChanges.current) {
      return;
    }

    if (transactionIdRef.current === transactionId) {
      return;
    }

    if (isEqual(content, contentRef.current)) {
      return;
    }

    const relativeSelection = getRelativeSelection(editor);
    editor.chain().setContent(content).run();

    if (relativeSelection != null) {
      restoreRelativeSelection(editor, relativeSelection);
    }

    transactionIdRef.current = transactionId;
    contentRef.current = content;
  }, [content, transactionId]);

  return (
    <div className="min-h-[500px]">
      {editor && canEdit && (
        <React.Fragment>
          <ToolbarMenu editor={editor} />
          <ActionMenu editor={editor} />
        </React.Fragment>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
