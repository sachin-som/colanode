import { generateId, IdType, generateNodeIndex } from '@colanode/core';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { fetchNode } from '@/lib/nodes';
import { JobHandler } from '@/types/jobs';
import { runAssistantResponseChain } from '@/lib/assistant';
import { getNodeModel } from '@colanode/core';
import { createNode } from '@/lib/nodes';
import { MessageAttributes } from '@colanode/core';

export type AssistantResponseInput = {
  type: 'assistant_response';
  messageId: string;
  workspaceId: string;
  selectedContextNodeIds?: string[];
};

declare module '@/types/jobs' {
  interface JobMap {
    assistant_response: {
      input: AssistantResponseInput;
    };
  }
}

export const assistantResponseHandler: JobHandler<
  AssistantResponseInput
> = async (input) => {
  const { messageId, workspaceId, selectedContextNodeIds } = input;
  console.log('Starting assistant response handler', {
    messageId,
    workspaceId,
    selectedContextNodeIds,
  });

  if (!configuration.ai.enabled) {
    return;
  }

  const message = await fetchNode(messageId);
  if (!message) {
    return;
  }

  const messageModel = getNodeModel(message.attributes.type);
  if (!messageModel) {
    return;
  }

  const messageText = messageModel.extractNodeText(
    message.id,
    message.attributes
  )?.attributes;
  if (!messageText) {
    return;
  }

  const [user, workspace] = await Promise.all([
    database
      .selectFrom('users')
      .where('id', '=', message.created_by)
      .selectAll()
      .executeTakeFirst(),
    (async () => {
      return database
        .selectFrom('workspaces')
        .where('id', '=', workspaceId)
        .select(['name', 'id'])
        .executeTakeFirst();
    })(),
  ]);

  if (!user || !workspace) {
    return;
  }

  try {
    const chainResult = await runAssistantResponseChain({
      userInput: messageText,
      workspaceId,
      userId: user.id,
      userDetails: {
        name: user.name || 'User',
        email: user.email || 'unknown@example.com',
      },
      parentMessageId: message.parent_id || message.id,
      currentMessageId: message.id,
      originalMessage: message,
      selectedContextNodeIds,
    });

    await createAndPublishResponse(
      chainResult.finalAnswer,
      chainResult.citations,
      message,
      workspaceId
    );
    console.log('Response published successfully');
  } catch (error) {
    console.error('Error in assistant response handler:', error);
    await createAndPublishResponse(
      'Sorry, I encountered an error while processing your request.',
      [],
      message,
      workspaceId
    );
  }
};

const createAndPublishResponse = async (
  response: string,
  citations: Array<{ sourceId: string; quote: string }> | undefined,
  originalMessage: any,
  workspaceId: string
) => {
  const id = generateId(IdType.Message);
  const blockId = generateId(IdType.Block);

  const messageAttributes: MessageAttributes = {
    type: 'message' as const,
    subtype: 'answer' as const,
    parentId: originalMessage.parent_id,
    content: {
      [blockId]: {
        id: blockId,
        type: 'paragraph',
        content: [{ type: 'text', text: response, marks: [] }],
        index: generateNodeIndex(),
        parentId: id,
      },
      ...(citations?.reduce((acc, citation) => {
        const citationBlockId = generateId(IdType.Block);
        return {
          ...acc,
          [citationBlockId]: {
            id: citationBlockId,
            type: 'citation',
            content: [
              { type: 'text', text: citation.quote, marks: [] },
              { type: 'text', text: citation.sourceId, marks: [] },
            ],
            index: generateNodeIndex(),
            parentId: id,
          },
        };
      }, {}) || {}),
    },
  };

  await createNode({
    nodeId: id,
    workspaceId,
    userId: 'colanode_ai',
    rootId: originalMessage.root_id,
    attributes: messageAttributes,
  });
};
