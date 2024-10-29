import { MutationHandler, MutationResult } from '@/operations/mutations';
import { DocumentSaveMutationInput } from '@/operations/mutations/document-save';
import { applyChangeToAttributesMap, mapContentsToBlocks } from '@/lib/editor';
import { NodeBlock } from '@/types/nodes';
import { updateNodeAtomically } from '@/main/utils';

export class DocumentSaveMutationHandler
  implements MutationHandler<DocumentSaveMutationInput>
{
  async handleMutation(
    input: DocumentSaveMutationInput,
  ): Promise<MutationResult<DocumentSaveMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.documentId,
      (attributesMap, attributes) => {
        const blocksMap = new Map<string, NodeBlock>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.documentId,
          input.content.content,
          blocksMap,
        );

        applyChangeToAttributesMap(attributesMap, blocks);
      },
    );

    if (!result) {
      return {
        output: {
          success: false,
        },
      };
    }

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
