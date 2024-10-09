import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { MessageCreateMutationInput } from '@/operations/mutations/message-create';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput,
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const id = generateId(IdType.Message);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.Message,
              parentId: input.conversationId,
              content: input.content.content,
            },
          },
          input.userId,
        ),
      )
      .execute();

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
      ],
    };
  }
}
