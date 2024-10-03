import { mapContentsToEditorNodes } from '@/renderer/editor/mappers';
import { databaseContext } from '@/electron/database-context';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { MessageCreateMutationInput } from '@/types/mutations/message-create';
import { LocalNode } from '@/types/nodes';
import { CreateNode } from '@/electron/schemas/workspace';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput,
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const id = NeuronId.generate(NeuronId.Type.Message);
    const editorNodes = mapContentsToEditorNodes(
      input.content.content,
      id,
      new Map<string, LocalNode>(),
    );

    const nodesToCreate: CreateNode[] = [
      buildCreateNode(
        {
          id: id,
          attributes: {
            type: NodeTypes.Message,
            parentId: input.conversationId,
          },
        },
        input.userId,
      ),
    ];

    for (const editorNode of editorNodes) {
      nodesToCreate.push(
        buildCreateNode(
          {
            id: editorNode.id,
            attributes: editorNode.attributes,
          },
          input.userId,
        ),
      );
    }

    await workspaceDatabase.insertInto('nodes').values(nodesToCreate).execute();

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
      ],
    };
  }
}
