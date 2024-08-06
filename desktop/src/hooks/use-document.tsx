import React from 'react';
import { debounce } from 'lodash';
import { Node } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { buildNodes, enumerateNodes, mapToEditorContent } from '@/editor/utils';
import { JSONContent } from '@tiptap/core';
import { buildNodeWithChildren } from '@/lib/nodes';

interface useNodeResult {
  content: JSONContent;
  onUpdate: (content: JSONContent) => void;
}

export const useDocument = (node: Node): useNodeResult => {
  const workspace = useWorkspace();
  const nodes = workspace.getNodes();
  const content = mapToEditorContent(node, nodes);

  const onUpdate = React.useMemo(
    () =>
      // Update the content of the node
      debounce(async (updatedContent: JSONContent) => {
        const nodeWithChildren = buildNodeWithChildren(node, nodes);
        const childNodes: Node[] = [];
        enumerateNodes(nodeWithChildren, childNodes);

        const newNodes = buildNodes(
          workspace,
          node,
          updatedContent.content,
          childNodes,
        );

        // for (const newNode of newNodes) {
        //   const existingNode = childNodes.find((n) => n.id === newNode.id);
        //   if (existingNode) {
        //     newNode.updatedBy = workspace.userNodeId;
        //     newNode.updatedAt = new Date();
        //     await workspace.updateNode(newNode);
        //   } else {
        //     await workspace.addNode(newNode);
        //   }
        // }

        const nodesToDelete = childNodes.filter(
          (n) => n.id != node.id && !newNodes.find((nn) => nn.id === n.id),
        );

        for (const nodeToDelete of nodesToDelete) {
          await workspace.deleteNode(nodeToDelete.id);
        }
      }, 500),
    [node.id],
  );

  return {
    content,
    onUpdate,
  };
};
