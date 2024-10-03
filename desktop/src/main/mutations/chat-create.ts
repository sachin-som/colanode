import { databaseContext } from '@/main/database-context';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { ChatCreateMutationInput } from '@/types/mutations/chat-create';

export class ChatCreateMutationHandler
  implements MutationHandler<ChatCreateMutationInput>
{
  async handleMutation(
    input: ChatCreateMutationInput,
  ): Promise<MutationResult<ChatCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const existingChats = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', NodeTypes.Chat)
      .where(
        'id',
        'in',
        workspaceDatabase
          .selectFrom('node_collaborators')
          .select('node_id')
          .where('collaborator_id', 'in', [input.userId, input.otherUserId])
          .groupBy('node_id')
          .having(workspaceDatabase.fn.count('collaborator_id'), '=', 2),
      )
      .execute();

    if (existingChats.length > 0) {
      const chat = existingChats[0];
      return {
        output: {
          id: chat.id,
        },
      };
    }

    const id = NeuronId.generate(NeuronId.Type.Chat);
    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('nodes')
        .values(
          buildCreateNode(
            {
              id: id,
              attributes: {
                type: NodeTypes.Chat,
              },
            },
            input.userId,
          ),
        )
        .execute();

      await trx
        .insertInto('node_collaborators')
        .values([
          {
            node_id: id,
            collaborator_id: input.userId,
            role: 'owner',
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
          {
            node_id: id,
            collaborator_id: input.otherUserId,
            role: 'owner',
            created_at: new Date().toISOString(),
            created_by: input.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          },
        ])
        .compile();
    });

    return {
      output: {
        id: id,
      },
      changedTables: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'node_collaborators',
          userId: input.userId,
        },
      ],
    };
  }
}
