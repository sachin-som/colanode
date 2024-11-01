import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { ChatCreateMutationInput } from '@/operations/mutations/chat-create';
import { sql } from 'kysely';
import { ChatAttributes } from '@/registry';
import { nodeManager } from '@/main/node-manager';

interface ChatRow {
  id: string;
}

export class ChatCreateMutationHandler
  implements MutationHandler<ChatCreateMutationInput>
{
  public async handleMutation(
    input: ChatCreateMutationInput,
  ): Promise<MutationResult<ChatCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<ChatRow>`
      SELECT id
      FROM nodes
      WHERE type = ${NodeTypes.Chat}
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.userId)}') is not null
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.otherUserId)}') is not null
    `.compile(workspaceDatabase);

    const existingChats = await workspaceDatabase.executeQuery(query);
    if (existingChats.rows?.length > 0) {
      const chat = existingChats.rows[0];
      return {
        output: {
          id: chat.id,
        },
      };
    }

    const id = generateId(IdType.Chat);
    const attributes: ChatAttributes = {
      type: 'chat',
      parentId: input.workspaceId,
      collaborators: {
        [input.userId]: NodeRole.Collaborator,
        [input.otherUserId]: NodeRole.Collaborator,
      },
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await nodeManager.createNode(trx, input.userId, id, attributes);
    });

    return {
      output: {
        id: id,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
