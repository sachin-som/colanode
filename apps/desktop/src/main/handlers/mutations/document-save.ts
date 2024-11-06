import { MutationHandler, MutationResult } from '@/operations/mutations';
import { DocumentSaveMutationInput } from '@/operations/mutations/document-save';
import { mapContentsToBlocks } from '@/lib/editor';
import { Block } from '@/registry';
import { nodeManager } from '@/main/node-manager';

export class DocumentSaveMutationHandler
  implements MutationHandler<DocumentSaveMutationInput>
{
  async handleMutation(
    input: DocumentSaveMutationInput,
  ): Promise<MutationResult<DocumentSaveMutationInput>> {
    await nodeManager.updateNode(
      input.userId,
      input.documentId,
      (attributes) => {
        if (attributes.type !== 'page' && attributes.type !== 'record') {
          throw new Error('Invalid node type');
        }

        const blocksMap = new Map<string, Block>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.documentId,
          input.content.content ?? [],
          blocksMap,
        );

        attributes.content = blocks.reduce(
          (acc, block) => {
            acc[block.id] = block;
            return acc;
          },
          {} as Record<string, Block>,
        );

        return attributes;
      },
    );

    return {
      output: {
        success: true,
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
