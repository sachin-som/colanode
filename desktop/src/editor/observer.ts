import { WorkspaceDatabaseSchema } from '@/data/schemas/workspace';
import { LeafNodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { LocalNode, NodeBlock } from '@/types/nodes';
import { Workspace } from '@/types/workspaces';
import { Editor, JSONContent } from '@tiptap/core';
import { CompiledQuery, Kysely } from 'kysely';
import { debounce, isEqual } from 'lodash';

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
    const contents: JSONContent[] = [];
    const childrenNodes = nodesArray
      .filter((node) => node.parentId === this.rootNode.id)
      .sort((a, b) => compareString(a.index, b.index));

    for (const child of childrenNodes) {
      const content = this.buildEditorContentFromNode(child, nodesArray);
      contents.push(content);
    }

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

  private buildEditorContentFromNode(
    node: LocalNode,
    nodesArray: LocalNode[],
  ): JSONContent {
    const editorContent: JSONContent = {
      type: node.type,
      attrs: {
        ...node.attrs,
        id: node.id,
      },
    };

    const childrenNodes = nodesArray
      .filter((n) => n.parentId === node.id)
      .sort((a, b) => compareString(a.index, b.index));

    if (childrenNodes.length > 0) {
      editorContent.content = editorContent.content || [];
      childrenNodes.forEach((child) => {
        editorContent.content.push(
          this.buildEditorContentFromNode(child, nodesArray),
        );
      });
    } else if (node.content && node.content.length > 0) {
      editorContent.content = editorContent.content || [];
      node.content.forEach((child) => {
        const childContent: JSONContent = {
          type: child.type,
          text: child.text,
        };

        if (child.marks && child.marks.length > 0) {
          childContent.marks = child.marks.map((mark) => {
            return {
              type: mark.type,
              attrs: mark.attrs,
            };
          });
        }

        editorContent.content.push(childContent);
      });
    }

    return editorContent;
  }

  private async checkEditorContentChanges() {
    const newNodesMap = this.buildNodesMapFromEditorContent(this.editorContent);
    const allNodeIds = new Set([
      ...this.nodesMap.keys(),
      ...newNodesMap.keys(),
    ]);

    const insertQueries: CompiledQuery[] = [];
    const updateQueries: CompiledQuery[] = [];
    const deleteQueries: CompiledQuery[] = [];
    for (const nodeId of allNodeIds) {
      const oldNode = this.nodesMap.get(nodeId);
      const newNode = newNodesMap.get(nodeId);

      if (!oldNode) {
        const query = this.database
          .insertInto('nodes')
          .values({
            id: newNode.id,
            type: newNode.type,
            parent_id: newNode.parentId,
            index: newNode.index,
            attrs: newNode.attrs ? JSON.stringify(newNode.attrs) : null,
            content: newNode.content ? JSON.stringify(newNode.content) : null,
            created_at: newNode.createdAt,
            created_by: newNode.createdBy,
            version_id: newNode.versionId,
          })
          .compile();

        insertQueries.push(query);
        this.nodesMap.set(newNode.id, newNode);
      } else if (!newNode) {
        const query = this.database
          .deleteFrom('nodes')
          .where('id', '=', oldNode.id)
          .compile();

        deleteQueries.push(query);
        this.nodesMap.delete(oldNode.id);
      } else if (!this.nodeEquals(oldNode, newNode)) {
        newNode.updatedAt = new Date().toISOString();
        newNode.updatedBy = this.workspace.userId;
        newNode.versionId = NeuronId.generate(NeuronId.Type.Version);

        const query = this.database
          .updateTable('nodes')
          .set({
            type: newNode.type,
            parent_id: newNode.parentId,
            index: newNode.index,
            attrs: newNode.attrs ? JSON.stringify(newNode.attrs) : null,
            content: newNode.content ? JSON.stringify(newNode.content) : null,
            updated_at: newNode.updatedAt,
            updated_by: newNode.updatedBy,
            version_id: newNode.versionId,
          })
          .where('id', '=', newNode.id)
          .compile();

        updateQueries.push(query);
        this.nodesMap.set(newNode.id, newNode);
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

  private buildNodesMapFromEditorContent(
    editorContent: JSONContent,
  ): Map<string, LocalNode> {
    const newNodesMap = new Map<string, LocalNode>();
    if (editorContent.content && editorContent.content.length > 0) {
      for (const child of editorContent.content) {
        this.buildNodeFromEditorContent(this.rootNode.id, child, newNodesMap);
      }
    }
    this.validateNodesIndexes(newNodesMap);
    return newNodesMap;
  }

  private buildNodeFromEditorContent(
    parentId: string,
    content: JSONContent,
    newNodesMap: Map<string, LocalNode>,
  ) {
    let id = content.attrs?.id;
    if (!id) {
      id = NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));
    }

    const existingNode = this.nodesMap.get(id);
    const newNode: LocalNode = existingNode
      ? { ...existingNode }
      : {
          id,
          type: content.type,
          parentId,
          index: null,
          attrs: null,
          content: null,
          createdAt: new Date().toISOString(),
          createdBy: this.workspace.userId,
          updatedAt: null,
          updatedBy: null,
          versionId: NeuronId.generate(NeuronId.Type.Version),
          serverCreatedAt: null,
          serverUpdatedAt: null,
          serverVersionId: null,
        };

    if (parentId !== newNode.parentId) {
      newNode.parentId = parentId;
    }

    if (content.attrs) {
      let attrs = { ...content.attrs };
      delete attrs.id;

      if (Object.keys(attrs).length > 0) {
        newNode.attrs = attrs;
      }
    }

    const contentChildren = content.content;
    const hasContentChildren = contentChildren && contentChildren.length > 0;
    const isLeafNode = LeafNodeTypes.includes(content.type);

    if (hasContentChildren && isLeafNode) {
      const nodeContent: NodeBlock[] = [];

      for (const child of content.content) {
        const nodeBlock: NodeBlock = {
          type: child.type,
          text: child.text,
        };

        if (child.marks && child.marks.length > 0) {
          nodeBlock.marks = child.marks.map((mark) => {
            return {
              type: mark.type,
              attrs: mark.attrs,
            };
          });
        }

        nodeContent.push(nodeBlock);
      }

      if (nodeContent.length > 0) {
        newNode.content = nodeContent;
      }
    }

    newNodesMap.set(newNode.id, newNode);

    if (hasContentChildren && !isLeafNode) {
      for (const child of content.content) {
        this.buildNodeFromEditorContent(newNode.id, child, newNodesMap);
      }
    }
  }

  private validateNodesIndexes(nodesMap: Map<string, LocalNode>) {
    //group by parentId
    const groupedNodes: { [key: string]: LocalNode[] } = {};
    for (const node of nodesMap.values()) {
      if (!groupedNodes[node.parentId]) {
        groupedNodes[node.parentId] = [];
      }

      groupedNodes[node.parentId].push(node);
    }

    for (const parentId in groupedNodes) {
      const nodes = groupedNodes[parentId];
      for (let i = 0; i < nodes.length; i++) {
        const currentIndex = nodes[i].index;
        const beforeIndex = i === 0 ? null : nodes[i - 1].index;

        // find the lowest index after the current node
        // we do this because sometimes nodes can be ordered in such a way that
        // the current node's index is higher than one of its siblings
        // after the next sibling
        // for example:  1, {current}, 4, 3
        let afterIndex = i === nodes.length - 1 ? null : nodes[i + 1].index;
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[j].index < afterIndex) {
            afterIndex = nodes[j].index;
            break;
          }
        }

        // extra check to make sure that the beforeIndex is less than the afterIndex
        // because otherwise the fractional index library will throw an error
        if (afterIndex < beforeIndex) {
          afterIndex = generateNodeIndex(null, beforeIndex);
        } else if (beforeIndex === afterIndex) {
          afterIndex = generateNodeIndex(beforeIndex, null);
        }

        if (
          !currentIndex ||
          currentIndex <= beforeIndex ||
          currentIndex > afterIndex
        ) {
          nodes[i].index = generateNodeIndex(beforeIndex, afterIndex);
        }
      }
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
        !this.nodeEquals(oldNode, newNode) &&
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

  private nodeEquals(oldNode: LocalNode, newNode: LocalNode): boolean {
    if (oldNode.index !== newNode.index) {
      return false;
    }

    if (oldNode.parentId !== newNode.parentId) {
      return false;
    }

    if (oldNode.type !== newNode.type) {
      return false;
    }

    if (!isEqual(oldNode.attrs, newNode.attrs)) {
      return false;
    }

    if (!isEqual(oldNode.content, newNode.content)) {
      return false;
    }

    return true;
  }
}
