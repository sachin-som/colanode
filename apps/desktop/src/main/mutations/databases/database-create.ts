import {
  DatabaseAttributes,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  DatabaseCreateMutationInput,
  DatabaseCreateMutationOutput,
} from '@/shared/mutations/databases/database-create';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class DatabaseCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput
  ): Promise<DatabaseCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const databaseId = generateId(IdType.Database);
    const viewId = generateId(IdType.View);
    const fieldId = generateId(IdType.Field);

    const attributes: DatabaseAttributes = {
      type: 'database',
      name: input.name,
      avatar: input.avatar,
      parentId: input.spaceId,
      fields: {
        [fieldId]: {
          id: fieldId,
          type: 'text',
          index: generateNodeIndex(null, null),
          name: 'Comment',
        },
      },
      views: {
        [viewId]: {
          id: viewId,
          type: 'table',
          name: 'Default',
          index: generateNodeIndex(null, null),
        },
      },
    };

    await workspace.entries.createEntry({
      id: databaseId,
      attributes,
      parentId: input.spaceId,
    });

    return {
      id: databaseId,
    };
  }
}
