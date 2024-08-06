import React from 'react';
import { CreateNodeInput, Node } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { ConversationStore } from '@/store/conversation';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes } from '@/lib/constants';
import { generateKeyBetween } from 'fractional-indexing-jittered';

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
      lastIndex = generateKeyBetween(lastIndex, null);
      buildMessageCreateInput(child, id, queue, lastIndex);
    }
  }
};
