import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { NeuronId } from '@/lib/id';
import {
  LocalNode,
  LocalNodeAttribute,
  LocalNodeWithAttributes,
} from '@/types/nodes';
import { Workspace } from '@/types/workspaces';
import { Editor, JSONContent } from '@tiptap/core';
import { CompiledQuery, Kysely } from 'kysely';
import { debounce, isEqual } from 'lodash';
import { mapContentsToEditorNodes, mapNodesToContents } from '@/editor/mappers';
import { EditorNode, EditorNodeAttribute } from '@/types/editor';

export class EditorObserver {
  private readonly workspace: Workspace;
  private readonly database: Kysely<WorkspaceDatabaseSchema>;
  private readonly rootNode: LocalNode;
  private readonly nodesMap: Map<string, LocalNodeWithAttributes>;
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
    nodesMap: Map<string, LocalNodeWithAttributes>,
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
        const newNode: LocalNodeWithAttributes = {
          id: editorNode.id,
          type: editorNode.type,
          parentId: editorNode.parentId,
          index: editorNode.index,
          content: editorNode.content,
          createdAt: new Date().toISOString(),
          createdBy: this.workspace.userId,
          versionId: NeuronId.generate(NeuronId.Type.Version),
          updatedAt: null,
          updatedBy: null,
          serverCreatedAt: null,
          serverUpdatedAt: null,
          serverVersionId: null,
          attributes: [],
        };

        const insertNodeQuery = this.database
          .insertInto('nodes')
          .values({
            id: editorNode.id,
            type: editorNode.type,
            parent_id: editorNode.parentId,
            index: editorNode.index,
            content: editorNode.content
              ? JSON.stringify(editorNode.content)
              : null,
            created_at: new Date().toISOString(),
            created_by: this.workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          })
          .compile();

        insertQueries.push(insertNodeQuery);
        this.nodesMap.set(newNode.id, newNode);

        if (editorNode.attributes && editorNode.attributes.length > 0) {
          for (const attribute of editorNode.attributes) {
            const nodeAttribute: LocalNodeAttribute = {
              nodeId: newNode.id,
              type: attribute.type,
              key: attribute.key,
              textValue: attribute.textValue,
              numberValue: attribute.numberValue,
              foreignNodeId: attribute.foreignNodeId,
              createdAt: new Date().toISOString(),
              createdBy: this.workspace.userId,
              versionId: NeuronId.generate(NeuronId.Type.Version),
              updatedAt: null,
              updatedBy: null,
              serverCreatedAt: null,
              serverUpdatedAt: null,
              serverVersionId: null,
            };

            newNode.attributes.push(nodeAttribute);

            const insertNodeAttributeQuery = this.database
              .insertInto('node_attributes')
              .values({
                node_id: newNode.id,
                type: nodeAttribute.type,
                key: nodeAttribute.key,
                text_value: nodeAttribute.textValue,
                number_value: nodeAttribute.numberValue,
                foreign_node_id: nodeAttribute.foreignNodeId,
                created_at: new Date().toISOString(),
                created_by: this.workspace.userId,
                version_id: NeuronId.generate(NeuronId.Type.Version),
              })
              .compile();

            insertQueries.push(insertNodeAttributeQuery);
          }
        }
      } else if (!editorNode) {
        const query = this.database
          .deleteFrom('nodes')
          .where('id', '=', existingNode.id)
          .compile();

        deleteQueries.push(query);
        this.nodesMap.delete(existingNode.id);
      } else {
        if (!this.nodeContentEquals(existingNode, editorNode)) {
          existingNode.type = editorNode.type;
          existingNode.parentId = editorNode.parentId;
          existingNode.index = editorNode.index;
          existingNode.content = editorNode.content;
          existingNode.updatedAt = new Date().toISOString();
          existingNode.updatedBy = this.workspace.userId;
          existingNode.versionId = NeuronId.generate(NeuronId.Type.Version);

          const query = this.database
            .updateTable('nodes')
            .set({
              type: existingNode.type,
              parent_id: existingNode.parentId,
              index: existingNode.index,
              content: existingNode.content
                ? JSON.stringify(existingNode.content)
                : null,
              updated_at: existingNode.updatedAt,
              updated_by: existingNode.updatedBy,
              version_id: existingNode.versionId,
            })
            .where('id', '=', existingNode.id)
            .compile();

          updateQueries.push(query);
        }

        for (const attribute of editorNode.attributes) {
          const existingAttribute = existingNode.attributes.find(
            (attr) =>
              attr.nodeId === existingNode.id &&
              attr.type === attribute.type &&
              attr.key === attribute.key,
          );

          if (!existingAttribute) {
            const newAttribute: LocalNodeAttribute = {
              nodeId: existingNode.id,
              type: attribute.type,
              key: attribute.key,
              textValue: attribute.textValue,
              numberValue: attribute.numberValue,
              foreignNodeId: attribute.foreignNodeId,
              createdAt: new Date().toISOString(),
              createdBy: this.workspace.userId,
              versionId: NeuronId.generate(NeuronId.Type.Version),
              updatedAt: null,
              updatedBy: null,
              serverCreatedAt: null,
              serverUpdatedAt: null,
              serverVersionId: null,
            };

            existingNode.attributes.push(newAttribute);

            const insertNodeAttributeQuery = this.database
              .insertInto('node_attributes')
              .values({
                node_id: existingNode.id,
                type: newAttribute.type,
                key: newAttribute.key,
                text_value: newAttribute.textValue,
                number_value: newAttribute.numberValue,
                foreign_node_id: newAttribute.foreignNodeId,
                created_at: newAttribute.createdAt,
                created_by: newAttribute.createdBy,
                version_id: newAttribute.versionId,
              })
              .compile();

            insertQueries.push(insertNodeAttributeQuery);
          } else if (!this.nodeAttributesEqual(existingAttribute, attribute)) {
            const updateNodeAttributeQuery = this.database
              .updateTable('node_attributes')
              .set({
                text_value: attribute.textValue,
                number_value: attribute.numberValue,
                foreign_node_id: attribute.foreignNodeId,
                updated_at: new Date().toISOString(),
                updated_by: this.workspace.userId,
                version_id: NeuronId.generate(NeuronId.Type.Version),
              })
              .where((eb) =>
                eb.and([
                  eb('node_id', '=', existingAttribute.nodeId),
                  eb('type', '=', existingAttribute.type),
                  eb('key', '=', existingAttribute.key),
                ]),
              )
              .compile();

            updateQueries.push(updateNodeAttributeQuery);
          }
        }

        for (const attribute of existingNode.attributes) {
          const editorAttribute = editorNode.attributes.find(
            (attr) =>
              attr.nodeId === existingNode.id &&
              attr.type === attribute.type &&
              attr.key === attribute.key,
          );

          if (!editorAttribute) {
            const deleteNodeAttributeQuery = this.database
              .deleteFrom('node_attributes')
              .where((eb) =>
                eb.and([
                  eb('node_id', '=', existingNode.id),
                  eb('type', '=', attribute.type),
                  eb('key', '=', attribute.key),
                ]),
              )
              .compile();

            deleteQueries.push(deleteNodeAttributeQuery);
          }
        }
      }
    }

    if (
      insertQueries.length > 0 ||
      updateQueries.length > 0 ||
      deleteQueries.length > 0
    ) {
      const queries = [...insertQueries, ...updateQueries, ...deleteQueries];
      await window.neuron.executeWorkspaceMutation(
        this.workspace.accountId,
        this.workspace.id,
        queries,
      );
    }
  }

  private checkNodesChanges(
    newNodesMap: Map<string, LocalNodeWithAttributes>,
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
        !this.nodeContentEquals(oldNode, newNode) &&
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

  private nodeContentEquals(
    existingNode: EditorNode,
    editorNode: EditorNode,
  ): boolean {
    if (existingNode.index !== editorNode.index) {
      return false;
    }

    if (existingNode.parentId !== editorNode.parentId) {
      return false;
    }

    if (existingNode.type !== editorNode.type) {
      return false;
    }

    if (!isEqual(existingNode.content, editorNode.content)) {
      return false;
    }

    return true;
  }

  private nodeAttributesEqual(
    existingAttribute: EditorNodeAttribute,
    editorAttribute: EditorNodeAttribute,
  ): boolean {
    if (existingAttribute.key !== editorAttribute.key) {
      return false;
    }

    if (existingAttribute.type !== editorAttribute.type) {
      return false;
    }

    if (existingAttribute.textValue !== editorAttribute.textValue) {
      return false;
    }

    if (existingAttribute.numberValue !== editorAttribute.numberValue) {
      return false;
    }

    if (existingAttribute.foreignNodeId !== editorAttribute.foreignNodeId) {
      return false;
    }

    return true;
  }
}
