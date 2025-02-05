import { PageAttributes } from '@colanode/core';
import { isEqual } from 'lodash-es';

import { MutationHandler } from '@/main/lib/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  PageContentUpdateMutationInput,
  PageContentUpdateMutationOutput,
} from '@/shared/mutations/pages/page-content-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class PageContentUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<PageContentUpdateMutationInput>
{
  async handleMutation(
    input: PageContentUpdateMutationInput
  ): Promise<PageContentUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    if (isEqual(input.before.content, input.after.content)) {
      return {
        success: true,
      };
    }

    const result = await workspace.nodes.updateNode<PageAttributes>(
      input.pageId,
      (attributes) => {
        const indexMap = new Map<string, string>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            indexMap.set(key, value.index);
          }
        }

        const beforeBlocks = mapContentsToBlocks(
          input.pageId,
          input.before.content ?? [],
          indexMap
        );

        const afterBlocks = mapContentsToBlocks(
          input.pageId,
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
        MutationErrorCode.PageUpdateForbidden,
        "You don't have permission to update this page."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.PageUpdateFailed,
        'Something went wrong while updating the page content.'
      );
    }

    return {
      success: true,
    };
  }
}
