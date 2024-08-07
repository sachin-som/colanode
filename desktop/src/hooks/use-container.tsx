import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import { Node } from '@/types/nodes';
import { useEventBus } from './use-event-bus';
import { ContainerStore } from '@/store/container';

interface useContainerResult {
  node: Node;
  breadcrumb: Node[];
}

export const useContainer = (containerId: string): useContainerResult => {
  const workspace = useWorkspace();
  const eventBus = useEventBus();
  const store = React.useMemo(() => new ContainerStore(), [containerId]);

  React.useEffect(() => {
    const fetchNodes = async () => {
      store.setIsLoading(true);

      const nodes = await workspace.getContainerNodes(containerId);
      store.setNodes(nodes);

      store.setIsLoading(false);
    };

    fetchNodes();

    const subscriptionId = eventBus.subscribe((event) => {
      if (event.event === 'node_created') {
        const createdNode = event.payload as Node;
        if (
          store.getNode(createdNode.id) ||
          createdNode.parentId === containerId
        ) {
          store.setNode(createdNode);
        } else {
          const parent = store.getNode(createdNode.parentId);
          if (parent) {
            store.setNode(createdNode);
          }
        }
      }

      if (event.event === 'node_updated') {
        const updatedNode = event.payload as Node;
        store.setNode(updatedNode);
      }

      if (event.event === 'node_deleted') {
        const deletedNodeId = event.payload as string;
        store.deleteNode(deletedNodeId);
      }
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [containerId]);

  const containerNode = store.getNode(containerId);

  return {
    node: containerNode,
    breadcrumb: buildBreadcrumb(store, containerNode),
  };
};

const buildBreadcrumb = (store: ContainerStore, node?: Node | null): Node[] => {
  if (!node) {
    return [];
  }

  const breadcrumb = [];
  let parent = store.getNode(node.parentId);
  while (parent) {
    breadcrumb.unshift(parent);
    parent = store.getNode(parent.parentId);
  }

  return breadcrumb;
};
