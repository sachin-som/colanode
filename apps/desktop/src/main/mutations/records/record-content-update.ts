import { RecordAttributes } from '@colanode/core';
import { isEqual } from 'lodash-es';

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
        const indexMap = new Map<string, string>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            indexMap.set(key, value.index);
          }
        }

        const beforeBlocks = mapContentsToBlocks(
          input.recordId,
          input.before.content ?? [],
          indexMap
        );

        const afterBlocks = mapContentsToBlocks(
          input.recordId,
          input.after.content ?? [],
          indexMap
        );

        const content = attributes.content ?? {};
        for (const afterBlock of afterBlocks) {
          const beforeBlock = beforeBlocks.find(
            (block) => block.id === afterBlock.id
          );

          if (!isEqual(beforeBlock, afterBlock)) {
            content[afterBlock.id] = afterBlock;
          }
        }

        for (const beforeBlock of beforeBlocks) {
          if (!content[beforeBlock.id]) {
            delete content[beforeBlock.id];
          }
        }

        attributes.content = content;
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
