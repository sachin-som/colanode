import * as Y from 'yjs';
import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { DatabaseCreateMutationInput } from '@/operations/mutations/database-create';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput,
  ): Promise<MutationResult<DatabaseCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const siblings = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.spaceId)
      .execute();

    const maxIndex =
      siblings.length > 0
        ? siblings.sort((a, b) => compareString(a.index, b.index))[
            siblings.length - 1
          ].index
        : null;

    const createdAt = new Date().toISOString();

    const databaseId = generateId(IdType.Database);
    const databaseVersionId = generateId(IdType.Version);

    const databaseDoc = new Y.Doc({
      guid: databaseId,
    });

    const attributesMap = databaseDoc.getMap('attributes');
    databaseDoc.transact(() => {
      attributesMap.set('type', NodeTypes.Database);
      attributesMap.set('parentId', input.spaceId);
      attributesMap.set('index', generateNodeIndex(maxIndex, null));
      attributesMap.set('name', input.name);

      const collaboratorsMap = new Y.Map<string>();
      collaboratorsMap.set(input.userId, NodeRole.Owner);
      attributesMap.set('collaborators', collaboratorsMap);
    });

    const databaseAttributes = JSON.stringify(attributesMap.toJSON());
    const databaseEncodedState = fromUint8Array(
      Y.encodeStateAsUpdate(databaseDoc),
    );

    const databaseChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: databaseId,
      state: databaseEncodedState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: databaseVersionId,
    };

    const tableViewId = generateId(IdType.TableView);
    const tableViewVersionId = generateId(IdType.Version);

    const tableViewDoc = new Y.Doc({
      guid: tableViewId,
    });

    const tableViewAttributesMap = tableViewDoc.getMap('attributes');
    tableViewDoc.transact(() => {
      tableViewAttributesMap.set('type', NodeTypes.TableView);
      tableViewAttributesMap.set('parentId', databaseId);
      tableViewAttributesMap.set('index', generateNodeIndex(null, null));
      tableViewAttributesMap.set('name', 'Default');
    });

    const tableViewAttributes = JSON.stringify(tableViewAttributesMap.toJSON());
    const tableViewEncodedState = fromUint8Array(
      Y.encodeStateAsUpdate(tableViewDoc),
    );

    const tableViewChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: tableViewId,
      state: tableViewEncodedState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: tableViewVersionId,
    };

    const fieldId = generateId(IdType.Field);
    const fieldVersionId = generateId(IdType.Version);

    const fieldDoc = new Y.Doc({
      guid: fieldId,
    });

    const fieldAttributesMap = fieldDoc.getMap('attributes');
    fieldDoc.transact(() => {
      fieldAttributesMap.set('type', NodeTypes.Field);
      fieldAttributesMap.set('parentId', databaseId);
      fieldAttributesMap.set('index', generateNodeIndex(null, null));
      fieldAttributesMap.set('name', 'Comment');
      fieldAttributesMap.set('dataType', 'text');
    });

    const fieldAttributes = JSON.stringify(fieldAttributesMap.toJSON());
    const fieldEncodedState = fromUint8Array(Y.encodeStateAsUpdate(fieldDoc));

    const fieldChangeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: fieldId,
      state: fieldEncodedState,
      createdAt: createdAt,
      createdBy: input.userId,
      versionId: fieldVersionId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('nodes')
        .values([
          {
            id: databaseId,
            attributes: databaseAttributes,
            state: databaseEncodedState,
            created_at: createdAt,
            created_by: input.userId,
            version_id: databaseVersionId,
          },
          {
            id: tableViewId,
            attributes: tableViewAttributes,
            state: tableViewEncodedState,
            created_at: createdAt,
            created_by: input.userId,
            version_id: tableViewVersionId,
          },
          {
            id: fieldId,
            attributes: fieldAttributes,
            state: fieldEncodedState,
            created_at: createdAt,
            created_by: input.userId,
            version_id: fieldVersionId,
          },
        ])
        .execute();

      await trx
        .insertInto('changes')
        .values([
          {
            data: JSON.stringify(databaseChangeData),
            created_at: createdAt,
          },
          {
            data: JSON.stringify(tableViewChangeData),
            created_at: createdAt,
          },
          {
            data: JSON.stringify(fieldChangeData),
            created_at: createdAt,
          },
        ])
        .execute();
    });

    return {
      output: {
        id: databaseId,
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
