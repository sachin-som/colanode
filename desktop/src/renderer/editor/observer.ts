import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { generateId, IdType } from '@/lib/id';
import { LocalNode } from '@/types/nodes';
import { Workspace } from '@/types/workspaces';
import { Editor, JSONContent } from '@tiptap/core';
import { CompiledQuery, Kysely } from 'kysely';
import { debounce, isEqual } from 'lodash';
import {
  mapContentsToEditorNodes,
  mapNodesToContents,
} from '@/renderer/editor/mappers';
import { EditorNode } from '@/types/editor';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';

export class EditorObserver {
  private readonly workspace: Workspace;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly rootNode: LocalNode;
  private readonly nodesMap: Map<string, LocalNode>;
  private editorContent: JSONContent;

  private readonly onEditorUpdateDebounced: () => void;
  private readonly onNodesChangeDebounced: (
    newNodesMap: Map<string, LocalNode>,
    editor: Editor,
  ) => void;

  constructor(
    workspace: Workspace,
    database: Kysely<WorkspaceDatabaseSchema>,
    rootNode: LocalNode,
    nodesMap: Map<string, LocalNode>,
  ) {
    this.workspace = workspace;
    this.database = database;
    this.rootNode = rootNode;
    this.nodesMap = nodesMap;
    this.editorContent = this.buildEditorContent();
    this.onEditorUpdateDebounced = debounce(
      this.checkEditorContentChanges,
      500,
    );
    this.onNodesChangeDebounced = debounce(this.checkNodesChanges, 500);
  }

  public getEditorContent(): JSONContent {
    return this.editorContent;
  }

  public onEditorUpdate(editor: Editor) {
    this.editorContent = editor.getJSON();
    this.onEditorUpdateDebounced();
  }

  public onNodesChange(nodes: Map<string, LocalNode>, editor: Editor) {
    this.onNodesChangeDebounced(nodes, editor);
  }

  private buildEditorContent(): JSONContent {
    const nodesArray = Array.from(this.nodesMap.values());
    const contents = mapNodesToContents(this.rootNode.id, nodesArray);

    if (!contents.length) {
      contents.push({
        type: 'paragraph',
      });
    }

    return {
      type: 'doc',
      content: contents,
    };
  }

  private async checkEditorContentChanges() {
    const editorNodes = mapContentsToEditorNodes(
      this.editorContent.content,
      this.rootNode.id,
      this.nodesMap,
    );

    const editorNodesMap = new Map<string, EditorNode>();
    for (const node of editorNodes) {
      editorNodesMap.set(node.id, node);
    }

    const allNodeIds = new Set([
      ...this.nodesMap.keys(),
      ...editorNodesMap.keys(),
    ]);

    const insertQueries: CompiledQuery[] = [];
    const updateQueries: CompiledQuery[] = [];
    const deleteQueries: CompiledQuery[] = [];

    for (const nodeId of allNodeIds) {
      const existingNode = this.nodesMap.get(nodeId);
      const editorNode = editorNodesMap.get(nodeId);

      if (!existingNode) {
        const doc = new Y.Doc({
          guid: editorNode.id,
        });

        const attributesMap = doc.getMap('attributes');

        doc.transact(() => {
          for (const [key, value] of Object.entries(editorNode.attributes)) {
            if (value !== undefined) {
              attributesMap.set(key, value);
            }
          }
        });

        const attributes = attributesMap.toJSON();
        const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

        const newNode: LocalNode = {
          id: editorNode.id,
          type: editorNode.attributes.type,
          parentId: editorNode.attributes.parentId,
          index: editorNode.attributes.index,
          attributes: editorNode.attributes,
          state: state,
          createdAt: new Date().toISOString(),
          createdBy: this.workspace.userId,
          versionId: generateId(IdType.Version),
          updatedAt: null,
          updatedBy: null,
          serverCreatedAt: null,
          serverUpdatedAt: null,
          serverVersionId: null,
        };

        const insertNodeQuery = this.database
          .insertInto('nodes')
          .values({
            id: editorNode.id,
            attributes: JSON.stringify(attributes),
            state: state,
            created_at: new Date().toISOString(),
            created_by: this.workspace.userId,
            version_id: generateId(IdType.Version),
          })
          .compile();

        insertQueries.push(insertNodeQuery);
        this.nodesMap.set(newNode.id, newNode);
      } else if (!editorNode) {
        const query = this.database
          .deleteFrom('nodes')
          .where('id', '=', existingNode.id)
          .compile();

        deleteQueries.push(query);
        this.nodesMap.delete(existingNode.id);
      } else {
        if (!isEqual(existingNode.attributes, editorNode.attributes)) {
          const doc = new Y.Doc({
            guid: existingNode.id,
          });

          Y.applyUpdate(doc, toUint8Array(existingNode.state));
          const attributesMap = doc.getMap('attributes');

          let hasChanges = false;
          doc.transact(() => {
            if (existingNode.attributes.type !== editorNode.attributes.type) {
              attributesMap.set('type', editorNode.attributes.type);
              hasChanges = true;
            }

            if (
              existingNode.attributes.parentId !==
              editorNode.attributes.parentId
            ) {
              attributesMap.set('parentId', editorNode.attributes.parentId);
              hasChanges = true;
            }

            if (existingNode.attributes.index !== editorNode.attributes.index) {
              attributesMap.set('index', editorNode.attributes.index);
              hasChanges = true;
            }

            if (
              !isEqual(
                existingNode.attributes.content,
                editorNode.attributes.content,
              )
            ) {
              attributesMap.set('content', editorNode.attributes.content);
              hasChanges = true;
            }

            for (const [key, value] of Object.entries(editorNode.attributes)) {
              const existingValue = attributesMap.get(key);
              if (!isEqual(existingValue, value)) {
                attributesMap.set(key, value);
                hasChanges = true;
              }
            }

            const existingAttributes = existingNode.attributes;
            const editorAttributes = editorNode.attributes;
            for (const key of Object.keys(existingAttributes)) {
              if (!(key in editorAttributes)) {
                attributesMap.delete(key);
                hasChanges = true;
              }
            }
          });

          if (!hasChanges) {
            continue;
          }

          const attributes = attributesMap.toJSON();
          const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

          existingNode.type = editorNode.attributes.type;
          existingNode.parentId = editorNode.attributes.parentId;
          existingNode.index = editorNode.attributes.index;
          existingNode.attributes = editorNode.attributes;
          existingNode.updatedAt = new Date().toISOString();
          existingNode.updatedBy = this.workspace.userId;
          existingNode.versionId = generateId(IdType.Version);

          const query = this.database
            .updateTable('nodes')
            .set({
              attributes: JSON.stringify(attributes),
              state: encodedState,
              updated_at: existingNode.updatedAt,
              updated_by: existingNode.updatedBy,
              version_id: existingNode.versionId,
            })
            .where('id', '=', existingNode.id)
            .compile();

          updateQueries.push(query);
        }
      }
    }

    if (
      insertQueries.length > 0 ||
      updateQueries.length > 0 ||
      deleteQueries.length > 0
    ) {
      const queries = [...insertQueries, ...updateQueries, ...deleteQueries];
      // await window.neuron.executeWorkspaceMutation(
      //   this.workspace.accountId,
      //   this.workspace.id,
      //   queries,
      // );
    }
  }

  private checkNodesChanges(
    newNodesMap: Map<string, LocalNode>,
    editor: Editor,
  ) {
    const allNodeIds = new Set([
      ...this.nodesMap.keys(),
      ...newNodesMap.keys(),
    ]);
    let hasChanges = false;

    for (const nodeId of allNodeIds) {
      const oldNode = this.nodesMap.get(nodeId);
      const newNode = newNodesMap.get(nodeId);

      if (!oldNode) {
        this.nodesMap.set(newNode.id, newNode);
        hasChanges = true;
      } else if (!newNode) {
        this.nodesMap.delete(oldNode.id);
        hasChanges = true;
      } else if (
        !isEqual(oldNode, newNode) &&
        oldNode.updatedAt !== null &&
        newNode.updatedAt !== null
      ) {
        const oldUpdatedAt = new Date(oldNode.updatedAt);
        const newUpdatedAt = new Date(newNode.updatedAt);
        if (oldUpdatedAt < newUpdatedAt) {
          this.nodesMap.set(newNode.id, newNode);
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      this.editorContent = this.buildEditorContent();
      const selection = editor.state.selection;
      if (selection.$anchor != null && selection.$head != null) {
        editor
          .chain()
          .setContent(this.editorContent)
          .setTextSelection(selection)
          .run();
      } else {
        editor.chain().setContent(this.editorContent).run();
      }
    }
  }
}
