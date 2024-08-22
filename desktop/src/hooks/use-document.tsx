import React from 'react';
import { debounce, isEqual } from 'lodash';
import { Node, NodeBlock } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { JSONContent } from '@tiptap/core';
import { DocumentStore } from '@/store/document';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes } from '@/lib/constants';
import { generateNodeIndex } from '@/lib/nodes';
import { useEventBus } from '@/hooks/use-event-bus';

interface useNodeResult {
  isLoaded: boolean;
  nodes: Node[];
  onUpdate: (content: JSONContent) => void;
}

export type NodeFromEditor = {
  type: string;
  id: string;
  parentId?: string | null;
  index?: string | null;
  attrs?: any | null;
  content?: NodeBlock[] | null;
  children?: NodeFromEditor[];
};

export const useDocument = (node: Node): useNodeResult => {
  const workspace = useWorkspace();
  const eventBus = useEventBus();
  const store = React.useMemo(() => new DocumentStore(), [node.id]);

  React.useEffect(() => {
    const fetchNodes = async () => {
      // const nodes = await workspace.getDocumentNodes(node.id);
      // store.setNodes(nodes);

      store.setIsLoaded(true);
    };

    fetchNodes();

    const subscriptionId = eventBus.subscribe((event) => {
      if (event.event === 'node_created') {
        const createdNode = event.payload as Node;
        if (store.getNode(createdNode.id) || createdNode.parentId === node.id) {
          store.setNode(createdNode);
        } else {
          const parent = store.getNode(createdNode.parentId);
          if (parent) {
            store.setNode(createdNode);
          }
        }
      } else if (event.event === 'node_updated') {
        const updatedNode = event.payload as Node;
        if (store.getNode(updatedNode.id)) {
          store.setNode(updatedNode);
        }
      } else if (event.event === 'node_deleted') {
        const deletedNode = event.payload as Node;
        if (store.getNode(deletedNode.id)) {
          store.deleteNode(deletedNode.id);
        }
      }
    });

    return () => {
      window.eventBus.unsubscribe(subscriptionId);
    };
  }, [node.id]);

  const onUpdate = React.useMemo(
    () =>
      debounce(async (updatedContent: JSONContent) => {
        // const childrenNodes = buildNodesFromEditor(
        //   updatedContent.content,
        //   node.id,
        // );
        //
        // const nodesToCreate: CreateNodeInput[] = [];
        // const nodesToUpdate: UpdateNodeInput[] = [];
        // const nodesToDelete: string[] = [];
        //
        // const currentNodes = store.nodes;
        // fillIndexesFromNodes(childrenNodes, currentNodes);
        // validateIndexes(childrenNodes);
        //
        // const editorNodes = flattenNodesFromEditor(childrenNodes);
        // for (const editorNode of editorNodes) {
        //   const existingNode = currentNodes[editorNode.id];
        //   if (!existingNode) {
        //     nodesToCreate.push({
        //       id: editorNode.id,
        //       type: editorNode.type,
        //       parentId: editorNode.parentId,
        //       index: editorNode.index,
        //       attrs: editorNode.attrs,
        //       content: editorNode.content,
        //     });
        //   } else if (hasChanged(existingNode, editorNode)) {
        //     nodesToUpdate.push({
        //       id: editorNode.id,
        //       parentId: editorNode.parentId,
        //       index: editorNode.index,
        //       attrs: editorNode.attrs,
        //       content: editorNode.content,
        //     });
        //   }
        // }
        //
        // const currentNodeIds = Object.keys(currentNodes);
        // for (const nodeId of currentNodeIds) {
        //   if (!editorNodes.find((node) => node.id === nodeId)) {
        //     nodesToDelete.push(nodeId);
        //   }
        // }
        //
        // if (nodesToCreate.length > 0) {
        //   await workspace.createNodes(nodesToCreate);
        // }
        //
        // if (nodesToUpdate.length > 0) {
        //   for (const nodeToUpdate of nodesToUpdate) {
        //     await workspace.updateNode(nodeToUpdate);
        //   }
        // }
        //
        // if (nodesToDelete.length > 0) {
        //   await workspace.deleteNodes(nodesToDelete);
        // }
      }, 500),
    [node.id],
  );

  return {
    isLoaded: store.isLoaded,
    nodes: store.getNodes(),
    onUpdate,
  };
};

const buildNodesFromEditor = (
  content: JSONContent[],
  parentId: string,
): NodeFromEditor[] => {
  if (!content || content.length === 0) {
    return [];
  }

  const children: NodeFromEditor[] = [];
  for (let i = 0; i < content.length; i++) {
    const child = buildNodeFromEditor(content[i], parentId);
    children.push(child);
  }

  return children;
};

const buildNodeFromEditor = (
  content: JSONContent,
  parentId: string,
): NodeFromEditor => {
  let id = content.attrs?.id;
  if (!id) {
    id = NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));
  }

  const index = content.attrs?.index;
  const attrs = content.attrs ? { ...content.attrs } : {};
  if (attrs.id) {
    delete attrs.id;
    delete attrs.index;
  }

  const nodeFromEditor: NodeFromEditor = {
    id: id,
    type: content.type,
    parentId,
    index: index,
    attrs: attrs,
  };

  if (!content.content || content.content.length === 0) {
    return nodeFromEditor;
  }

  if (LeafNodeTypes.includes(content.type)) {
    nodeFromEditor.content = [];
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

      nodeFromEditor.content.push(nodeBlock);
    }
  } else {
    nodeFromEditor.children = [];
    for (let i = 0; i < content.content.length; i++) {
      const childNode = buildNodeFromEditor(content.content[i], id);
      nodeFromEditor.children.push(childNode);
    }
  }

  return nodeFromEditor;
};

const fillIndexesFromNodes = (
  nodesFromEditor: NodeFromEditor[],
  nodes: Record<string, Node>,
) => {
  for (const nodeFromEditor of nodesFromEditor) {
    const node = nodes[nodeFromEditor.id];
    if (node) {
      nodeFromEditor.index = node.index;
    }

    if (nodeFromEditor.children) {
      fillIndexesFromNodes(nodeFromEditor.children, nodes);
    }
  }
};

const validateIndexes = (nodes: NodeFromEditor[]) => {
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

    if (nodes[i].children) {
      validateIndexes(nodes[i].children);
    }
  }
};

const flattenNodesFromEditor = (
  nodesFromEditor: NodeFromEditor[],
): NodeFromEditor[] => {
  const nodes: Node[] = [];
  nodesFromEditor.forEach((node) => {
    enumerateNodesFromEditor(node, nodes);
  });

  return nodes;
};

const enumerateNodesFromEditor = (
  node: NodeFromEditor,
  nodes: NodeFromEditor[],
) => {
  nodes.push(node);
  node.children?.forEach((child) => {
    enumerateNodesFromEditor(child, nodes);
  });
};

const hasChanged = (existingNode: Node, editorNode: NodeFromEditor) => {
  if (existingNode.type !== editorNode.type) {
    return true;
  }

  if (existingNode.parentId !== editorNode.parentId) {
    return true;
  }

  if (existingNode.index !== editorNode.index) {
    return true;
  }

  if (deepHasChanged(existingNode.attrs, editorNode.attrs)) {
    return true;
  }

  if (deepHasChanged(existingNode.content, editorNode.content)) {
    return true;
  }

  return false;
};

const deepHasChanged = (a: any, b: any): boolean => {
  if (a === b) {
    return false;
  }

  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }

  return !isEqual(a, b);
};
