import React from 'react';
import '@/renderer/styles/editor.css';
import { debounce } from 'lodash';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import {
  ParagraphCommand,
  BlockquoteCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  BulletListCommand,
  CodeBlockCommand,
  OrderedListCommand,
  DividerCommand,
  TodoCommand,
  PageCommand,
  FolderCommand,
} from '@/renderer/editor/commands';
import {
  IdExtension,
  DocumentNode,
  PageNode,
  FolderNode,
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
  PlaceholderExtension,
  TaskListNode,
  TaskItemNode,
  CommanderExtension,
  DividerNode,
  TrailingNode,
  BoldMark,
  ItalicMark,
  UnderlineMark,
  StrikethroughMark,
  CodeMark,
  ColorMark,
  HighlightMark,
  LinkMark,
  DeleteControlExtension,
  DropcursorExtension,
} from '@/renderer/editor/extensions';
import { EditorBubbleMenu } from '@/renderer/editor/menu/bubble-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface DocumentEditorProps {
  documentId: string;
  content: JSONContent;
  hash: string;
}

export const DocumentEditor = ({
  documentId,
  content,
  hash,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const hasPendingChanges = React.useRef(false);
  const hashRef = React.useRef(hash);
  const debouncedSave = React.useMemo(
    () =>
      debounce((content: JSONContent) => {
        hasPendingChanges.current = false;
        mutate({
          input: {
            type: 'document_save',
            documentId: documentId,
            userId: workspace.userId,
            content,
          },
        });
      }, 500),
    [mutate, documentId, workspace.userId],
  );

  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        PageNode,
        FolderNode,
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
            DividerCommand,
            TodoCommand,
            FolderCommand,
          ],
          context: {
            documentId,
            userId: workspace.userId,
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
      shouldRerenderOnTransaction: false,
      autofocus: 'start',
      onUpdate: async ({ editor, transaction }) => {
        if (transaction.docChanged) {
          hasPendingChanges.current = true;
          debouncedSave(editor.getJSON());
        }
      },
    },
    [documentId],
  );

  React.useEffect(() => {
    if (hasPendingChanges.current) {
      return;
    }

    if (hashRef.current === hash) {
      return;
    }

    const selection = editor.state.selection;
    if (selection.$anchor != null && selection.$head != null) {
      editor.chain().setContent(content).setTextSelection(selection).run();
    } else {
      editor.chain().setContent(content).run();
    }

    hashRef.current = hash;
  }, [content, hash]);

  return (
    <div className="min-h-[500px]">
      {editor && (
        <React.Fragment>
          <EditorBubbleMenu editor={editor} />
        </React.Fragment>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
