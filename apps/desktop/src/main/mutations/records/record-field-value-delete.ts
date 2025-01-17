import { RecordAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  RecordFieldValueDeleteMutationInput,
  RecordFieldValueDeleteMutationOutput,
} from '@/shared/mutations/records/record-field-value-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class RecordFieldValueDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordFieldValueDeleteMutationInput>
{
  async handleMutation(
    input: RecordFieldValueDeleteMutationInput
  ): Promise<RecordFieldValueDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry<RecordAttributes>(
      input.recordId,
      (attributes) => {
        delete attributes.fields[input.fieldId];
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to delete this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while deleting the field value. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
