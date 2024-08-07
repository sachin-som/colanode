import React from 'react';
import { CreateNodeInput, Node } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { ConversationStore } from '@/store/conversation';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes } from '@/lib/constants';
import { generateNodeIndex } from '@/lib/nodes';
import { useEventBus } from './use-event-bus';

interface useConversationResult {
  isLoading: boolean;
  nodes: Node[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  createMessage: (content: JSONContent) => void;
}

export const useConversation = (
  conversationId: string,
): useConversationResult => {
  const workspace = useWorkspace();
  const eventBus = useEventBus();
  const store = React.useMemo(() => new ConversationStore(), [conversationId]);

  React.useEffect(() => {
    const fetchNodes = async () => {
      store.setIsLoading(true);
      const nodes = await workspace.getConversationNodes(
        conversationId,
        10,
        null,
      );
      store.setNodes(nodes);
      store.setIsLoading(false);
    };

    fetchNodes();

    const subscriptionId = eventBus.subscribe((event) => {
      if (event.event === 'node_created') {
        const createdNode = event.payload as Node;
        if (
          store.getNode(createdNode.id) ||
          createdNode.parentId === conversationId
        ) {
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
      } else if (event.event === 'node-deleted') {
        const deletedNode = event.payload as Node;
        if (store.getNode(deletedNode.id)) {
          store.deleteNode(deletedNode.id);
        }
      }
    });

    return () => {
      eventBus.unsubscribe(subscriptionId);
    };
  }, [conversationId]);

  const createMessage = async (content: JSONContent) => {
    const inputs = buildMessageCreateInputs(conversationId, content);
    await workspace.createNodes(inputs);
  };

  return {
    isLoading: store.isLoading,
    nodes: store.getNodes(),
    hasMore: store.hasMore,
    loadMore: () => console.log('load more'),
    isLoadingMore: store.isLoadingMore,
    createMessage: createMessage,
  };
};

const buildMessageCreateInputs = (
  conversationId: string,
  content: JSONContent,
): CreateNodeInput[] => {
  const inputs: CreateNodeInput[] = [];
  buildMessageCreateInput(content, conversationId, inputs);
  return inputs;
};

const buildMessageCreateInput = (
  content: JSONContent,
  parentId: string,
  queue: CreateNodeInput[],
  index?: string | null,
): void => {
  const id = content.attrs?.id ?? NeuronId.generate(NeuronId.Type.Message);
  const input: CreateNodeInput = {
    id: id,
    parentId,
    type: content.type,
    attrs: {},
    index,
  };
  queue.push(input);

  if (content.attrs) {
    delete content.attrs.id;
    if (Object.keys(content.attrs).length > 0) {
      input.attrs = content.attrs;
    }
  }

  if (LeafNodeTypes.includes(content.type)) {
    input.content = [];
    for (const child of content.content) {
      input.content.push({
        type: child.type,
        text: child.text,
        marks: child.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }),
      });
    }
  } else {
    let lastIndex: string | null = null;
    for (const child of content.content) {
      lastIndex = generateNodeIndex(lastIndex, null);
      buildMessageCreateInput(child, id, queue, lastIndex);
    }
  }
};
