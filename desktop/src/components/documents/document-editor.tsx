import React from 'react';
import '@/styles/editor.css';
import { useEditor, EditorContent } from '@tiptap/react';
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
} from '@/editor/commands';
import {
  IdExtension,
  DocumentNode,
  PageNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
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
} from '@/editor/extensions';

import { EditorBubbleMenu } from '@/editor/menu/bubble-menu';
import { LocalNode } from '@/types/nodes';
import {
  editorNodeMapEquals,
  mapEditorNodesToJSONContent,
  mapJSONContentToEditorNodes,
  mapNodesToEditorNodes,
} from '@/editor/utils';
import { EditorNode } from '@/types/editor';
import { Editor } from '@tiptap/core';
import { debounce, isEqual } from 'lodash';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';

interface DocumentEditorProps {
  node: LocalNode;
  nodes: LocalNode[];
}

export const DocumentEditor = ({ node, nodes }: DocumentEditorProps) => {
  const workspace = useWorkspace();
  const nodesSnapshot = React.useRef<Map<string, EditorNode>>(
    mapNodesToEditorNodes(nodes),
  );

  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        PageNode,
        TextNode,
        ParagraphNode,
        HeadingNode,
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
          ],
          context: {},
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
      content: mapEditorNodesToJSONContent(node.id, nodesSnapshot.current),
      shouldRerenderOnTransaction: false,
      autofocus: 'start',
      onUpdate: async ({ editor, transaction }) => {
        if (transaction.docChanged) {
          await checkForLocalChanges(editor);
        }
      },
    },
    [node.id],
  );

  React.useEffect(() => {
    checkForRemoteChanges(nodes, editor);
  }, [editor, nodes]);

  const checkForLocalChanges = React.useCallback(
    debounce(async (editor: Editor) => {
      const editorContent = editor.getJSON();
      const newEditorNodes = mapJSONContentToEditorNodes(
        node.id,
        editorContent,
      );

      if (editorNodeMapEquals(newEditorNodes, nodesSnapshot.current)) {
        return;
      }

      for (const newEditorNode of newEditorNodes.values()) {
        const existingEditorNode = nodesSnapshot.current.get(newEditorNode.id);
        if (!existingEditorNode) {
          const query = workspace.schema
            .insertInto('nodes')
            .values({
              id: newEditorNode.id,
              type: newEditorNode.type,
              parent_id: newEditorNode.parentId,
              index: newEditorNode.index,
              attrs: newEditorNode.attrs
                ? JSON.stringify(newEditorNode.attrs)
                : null,
              content: newEditorNode.content
                ? JSON.stringify(newEditorNode.content)
                : null,
              created_at: new Date().toISOString(),
              created_by: workspace.userId,
              version_id: NeuronId.generate(NeuronId.Type.Version),
            })
            .compile();

          await workspace.mutate(query);
        } else if (!isEqual(existingEditorNode, newEditorNode)) {
          const updateNodeMutation = workspace.schema
            .updateTable('nodes')
            .set({
              attrs: newEditorNode.attrs
                ? JSON.stringify(newEditorNode.attrs)
                : null,
              content: newEditorNode.content
                ? JSON.stringify(newEditorNode.content)
                : null,
            })
            .compile();

          await workspace.mutate(updateNodeMutation);
        }
      }

      const toDeleteIds: string[] = [];
      for (const existingEditorNode of nodesSnapshot.current.values()) {
        if (!newEditorNodes.has(existingEditorNode.id)) {
          toDeleteIds.push(existingEditorNode.id);
        }
      }

      if (toDeleteIds.length > 0) {
        const deleteNodesMutation = workspace.schema
          .deleteFrom('nodes')
          .where('id', 'in', toDeleteIds)
          .compile();

        await workspace.mutate(deleteNodesMutation);
      }

      nodesSnapshot.current = newEditorNodes;
    }, 100),
    [node.id],
  );

  const checkForRemoteChanges = React.useCallback(
    debounce((remoteNodes: LocalNode[], editor: Editor) => {
      const remoteEditorNodes = mapNodesToEditorNodes(remoteNodes);
      if (editorNodeMapEquals(remoteEditorNodes, nodesSnapshot.current)) {
        return;
      }

      const currentEditorContent = editor.getJSON();
      const currentEditorNodes = mapJSONContentToEditorNodes(
        node.id,
        currentEditorContent,
      );

      const editorNodeIds = new Set<string>([
        ...currentEditorNodes.keys(),
        ...remoteEditorNodes.keys(),
      ]);

      const newEditorNodes: Map<string, EditorNode> = new Map();
      let hasChanges = false;
      for (const editorNodeId of editorNodeIds) {
        const currentEditorNode = currentEditorNodes.get(editorNodeId);
        const snapshotEditorNode = nodesSnapshot.current.get(editorNodeId);
        const remoteEditorNode = remoteEditorNodes.get(editorNodeId);

        if (!currentEditorNode) {
          newEditorNodes.set(editorNodeId, remoteEditorNode);
          hasChanges = true;
          continue;
        }

        if (!snapshotEditorNode) {
          newEditorNodes.set(editorNodeId, currentEditorNode);
          continue;
        }

        if (!remoteEditorNode) {
          newEditorNodes.set(editorNodeId, currentEditorNode);
          continue;
        }

        if (!isEqual(currentEditorNode, snapshotEditorNode)) {
          newEditorNodes.set(editorNodeId, currentEditorNode);
          continue;
        }

        if (!isEqual(snapshotEditorNode, remoteEditorNode)) {
          newEditorNodes.set(editorNodeId, remoteEditorNode);
          hasChanges = true;
          continue;
        }

        newEditorNodes.set(editorNodeId, currentEditorNode);
      }

      if (!hasChanges) {
        return;
      }

      const newEditorContent = mapEditorNodesToJSONContent(
        node.id,
        newEditorNodes,
      );

      const selection = editor.state.selection;
      editor
        .chain()
        .setContent(newEditorContent)
        .setTextSelection(selection)
        .run();
      nodesSnapshot.current = newEditorNodes;
    }, 100),
    [node.id],
  );

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
