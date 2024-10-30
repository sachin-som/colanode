import { databaseManager } from '@/main/data/database-manager';
import { NodeRole, NodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { ChatCreateMutationInput } from '@/operations/mutations/chat-create';
import { sql } from 'kysely';
import * as Y from 'yjs';
import { fromUint8Array } from 'js-base64';
import { LocalCreateNodeChangeData } from '@/types/sync';

interface ChatRow {
  id: string;
}

export class ChatCreateMutationHandler
  implements MutationHandler<ChatCreateMutationInput>
{
  public async handleMutation(
    input: ChatCreateMutationInput,
  ): Promise<MutationResult<ChatCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<ChatRow>`
      SELECT id
      FROM nodes
      WHERE type = ${NodeTypes.Chat}
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.userId)}') = 'owner'
      AND json_extract(attributes, '$.collaborators.${sql.raw(input.otherUserId)}') = 'owner'
    `.compile(workspaceDatabase);

    const existingChats = await workspaceDatabase.executeQuery(query);
    if (existingChats.rows?.length > 0) {
      const chat = existingChats.rows[0];
      return {
        output: {
          id: chat.id,
        },
      };
    }

    const id = generateId(IdType.Chat);
    const versionId = generateId(IdType.Version);
    const createdAt = new Date().toISOString();

    const doc = new Y.Doc({
      guid: id,
    });

    const attributesMap = doc.getMap('attributes');

    doc.transact(() => {
      attributesMap.set('type', NodeTypes.Chat);
      attributesMap.set('collaborators', new Y.Map());

      const collaboratorsMap = attributesMap.get('collaborators') as Y.Map<any>;
      collaboratorsMap.set(input.userId, NodeRole.Owner);
      collaboratorsMap.set(input.otherUserId, NodeRole.Owner);
    });

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalCreateNodeChangeData = {
      type: 'node_create',
      id: id,
      state: encodedState,
      createdAt: new Date().toISOString(),
      createdBy: input.userId,
      versionId: versionId,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .insertInto('nodes')
        .values({
          id: id,
          attributes: attributes,
          state: encodedState,
          created_at: createdAt,
          created_by: input.userId,
          version_id: versionId,
        })
        .execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: createdAt,
        })
        .execute();
    });

    return {
      output: {
        id: id,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
