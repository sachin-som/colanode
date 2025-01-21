import { RecordAttributes } from '@colanode/core';
import { isEqual } from 'lodash-es';

import { MutationHandler } from '@/main/lib/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  RecordContentUpdateMutationInput,
  RecordContentUpdateMutationOutput,
} from '@/shared/mutations/records/record-content-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class RecordContentUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordContentUpdateMutationInput>
{
  async handleMutation(
    input: RecordContentUpdateMutationInput
  ): Promise<RecordContentUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    if (isEqual(input.before.content, input.after.content)) {
      return {
        success: true,
      };
    }

    const result = await workspace.entries.updateEntry<RecordAttributes>(
      input.recordId,
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
          const afterBlock = afterBlocks.find(
            (block) => block.id === beforeBlock.id
          );

          if (!afterBlock) {
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
