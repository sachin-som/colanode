import { Block, RecordAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  RecordContentUpdateMutationInput,
  RecordContentUpdateMutationOutput,
} from '@/shared/mutations/records/record-content-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class RecordContentUpdateMutationHandler
  implements MutationHandler<RecordContentUpdateMutationInput>
{
  async handleMutation(
    input: RecordContentUpdateMutationInput
  ): Promise<RecordContentUpdateMutationOutput> {
    const result = await entryService.updateEntry<RecordAttributes>(
      input.recordId,
      input.userId,
      (attributes) => {
        const blocksMap = new Map<string, Block>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.recordId,
          input.content.content ?? [],
          blocksMap
        );

        attributes.content = blocks.reduce(
          (acc, block) => {
            acc[block.id] = block;
            return acc;
          },
          {} as Record<string, Block>
        );

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to update this record."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while updating the record content. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
