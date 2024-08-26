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
import { Node } from '@/types/nodes';
import {
  editorNodeArrayEquals,
  mapEditorNodesToJSONContent,
  mapJSONContentToEditorNodes,
  mapNodesToEditorNodes,
} from '@/editor/utils';
import { EditorNode } from '@/types/editor';
import { Editor } from '@tiptap/core';
import { debounce, isEqual } from 'lodash';
import {
  LocalCreateNodesMutation,
  LocalDeleteNodesMutation,
  LocalUpdateNodeMutation,
} from '@/types/mutations';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';

interface DocumentEditorProps {
  node: Node;
  nodes: Node[];
}

export const DocumentEditor = ({ node, nodes }: DocumentEditorProps) => {
  const workspace = useWorkspace();
  const databaseNodes = React.useRef<EditorNode[]>(
    mapNodesToEditorNodes(nodes),
  );
  const localNodes = React.useRef<EditorNode[]>(databaseNodes.current);

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
      content: mapEditorNodesToJSONContent(node.id, localNodes.current),
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
    console.log('nodes changed', nodes);
    checkForDatabaseChanges(nodes, editor);
  }, [editor, nodes]);

  const checkForLocalChanges = React.useCallback(
    debounce(async (editor: Editor) => {
      const editorContent = editor.getJSON();
      const newEditorNodes = mapJSONContentToEditorNodes(
        node.id,
        editorContent,
      );

      if (editorNodeArrayEquals(newEditorNodes, localNodes.current)) {
        return;
      }

      localNodes.current = newEditorNodes;
      if (editorNodeArrayEquals(newEditorNodes, databaseNodes.current)) {
        return;
      }

      const createNodesMutation: LocalCreateNodesMutation = {
        type: 'create_nodes',
        data: {
          nodes: [],
        },
      };
      const updateNodeMutations: LocalUpdateNodeMutation[] = [];
      const deleteNodesMutation: LocalDeleteNodesMutation = {
        type: 'delete_nodes',
        data: {
          ids: [],
        },
      };

      for (const newEditorNode of newEditorNodes) {
        const existingEditorNode = databaseNodes.current.find(
          (n) => n.id === newEditorNode.id,
        );

        if (!existingEditorNode) {
          createNodesMutation.data.nodes.push({
            id: newEditorNode.id,
            type: newEditorNode.type,
            workspaceId: workspace.id,
            parentId: newEditorNode.parentId,
            index: newEditorNode.index,
            attrs: newEditorNode.attrs,
            content: newEditorNode.content,
            createdAt: new Date().toISOString(),
            createdBy: workspace.userId,
            versionId: NeuronId.generate(NeuronId.Type.Version),
          });
        } else if (!isEqual(existingEditorNode, newEditorNode)) {
          updateNodeMutations.push({
            type: 'update_node',
            data: {
              id: newEditorNode.id,
              type: newEditorNode.type,
              parentId: newEditorNode.parentId,
              index: newEditorNode.index,
              attrs: newEditorNode.attrs,
              content: newEditorNode.content,
              updatedAt: new Date().toISOString(),
              updatedBy: workspace.userId,
              versionId: NeuronId.generate(NeuronId.Type.Version),
            },
          });
        }
      }

      for (const existingEditorNode of databaseNodes.current) {
        if (!newEditorNodes.find((n) => n.id === existingEditorNode.id)) {
          deleteNodesMutation.data.ids.push(existingEditorNode.id);
        }
      }

      if (createNodesMutation.data.nodes.length > 0) {
        await workspace.mutate(createNodesMutation);
      }

      if (updateNodeMutations.length > 0) {
        for (const updateNodeMutation of updateNodeMutations) {
          await workspace.mutate(updateNodeMutation);
        }
      }

      if (deleteNodesMutation.data.ids.length > 0) {
        await workspace.mutate(deleteNodesMutation);
      }
    }, 500),
    [node.id],
  );

  const checkForDatabaseChanges = React.useCallback(
    debounce((newDatabaseNodes: Node[], editor: Editor) => {
      const newEditorNodes = mapNodesToEditorNodes(newDatabaseNodes);
      if (editorNodeArrayEquals(newEditorNodes, databaseNodes.current)) {
        return;
      }

      databaseNodes.current = newEditorNodes;
      if (editorNodeArrayEquals(newEditorNodes, localNodes.current)) {
        return;
      }

      //here we need to update the editor content
      const newEditorContent = mapEditorNodesToJSONContent(
        node.id,
        newEditorNodes,
      );
      editor.commands.setContent(newEditorContent);
      localNodes.current = newEditorNodes;
    }, 500),
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
