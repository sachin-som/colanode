import { NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  ExecuteLocalMutationsInput,
  LocalMutation,
  LocalNodeMutationData,
  LocalNodePermissionMutationData,
  LocalNodeReactionMutationData,
} from '@/types/mutations';
import { database } from '@/data/database';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';

export const mutationsRouter = Router();

mutationsRouter.post('/', async (req: NeuronRequest, res: NeuronResponse) => {
  const input = req.body as ExecuteLocalMutationsInput;
  const executedMutations: number[] = [];
  for (const mutation of input.mutations) {
    try {
      switch (mutation.table) {
        case 'nodes': {
          switch (mutation.action) {
            case 'insert': {
              await handleCreateNodeMutation(input.workspaceId, mutation);
              break;
            }
            case 'update': {
              await handleUpdateNodeMutation(input.workspaceId, mutation);
              break;
            }
            case 'delete': {
              await handleDeleteNodeMutation(input.workspaceId, mutation);
              break;
            }
          }
          break;
        }
        case 'node_permissions': {
          switch (mutation.action) {
            case 'insert': {
              await handleCreateNodePermissionMutation(
                input.workspaceId,
                mutation,
              );
              break;
            }
            case 'update': {
              await handleUpdateNodePermissionMutation(
                input.workspaceId,
                mutation,
              );
              break;
            }
            case 'delete': {
              await handleDeleteNodePermissionMutation(
                input.workspaceId,
                mutation,
              );
              break;
            }
          }
          break;
        }
        case 'node_reactions': {
          switch (mutation.action) {
            case 'insert': {
              await handleCreateNodeReactionMutation(
                input.workspaceId,
                mutation,
              );
              break;
            }
            case 'delete': {
              await handleDeleteNodeReactionMutation(mutation);
              break;
            }
          }
          break;
        }
      }

      executedMutations.push(mutation.id);
    } catch (error) {
      console.error(error);
    }
  }

  res.status(200).json({ success: true, executedMutations });
});

const handleCreateNodeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodeData = JSON.parse(mutation.after) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (existingNode) {
    return;
  }

  await database
    .insertInto('nodes')
    .values({
      id: nodeData.id,
      attributes: nodeData.attributes,
      workspace_id: workspaceId,
      state: nodeData.state,
      created_at: new Date(nodeData.created_at),
      created_by: nodeData.created_by,
      version_id: nodeData.version_id,
      server_created_at: new Date(),
    })
    .execute();
};

const handleUpdateNodeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodeData = JSON.parse(mutation.after) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .select(['id', 'workspace_id', 'state'])
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (!existingNode || existingNode.workspace_id != workspaceId) {
    return;
  }

  const updatedAt = nodeData.updated_at
    ? new Date(nodeData.updated_at)
    : new Date();
  const updatedBy = nodeData.updated_by ?? nodeData.created_by;

  const doc = new Y.Doc({
    guid: nodeData.id,
  });

  Y.applyUpdate(doc, toUint8Array(existingNode.state));
  Y.applyUpdate(doc, toUint8Array(nodeData.state));

  const attributesMap = doc.getMap('attributes');
  const attributes = JSON.stringify(attributesMap.toJSON());
  const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

  await database
    .updateTable('nodes')
    .set({
      attributes: attributes,
      state: encodedState,
      updated_at: updatedAt,
      updated_by: updatedBy,
      version_id: nodeData.version_id,
      server_updated_at: new Date(),
    })
    .where('id', '=', nodeData.id)
    .execute();
};

const handleDeleteNodeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.before) {
    return;
  }

  const nodeData = JSON.parse(mutation.before) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', nodeData.id)
    .select(['id', 'workspace_id'])
    .executeTakeFirst();

  if (!existingNode || existingNode.workspace_id !== workspaceId) {
    return;
  }

  await database.deleteFrom('nodes').where('id', '=', nodeData.id).execute();
};

const handleCreateNodePermissionMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodeReactionData = JSON.parse(
    mutation.after,
  ) as LocalNodeReactionMutationData;
  await database
    .insertInto('node_reactions')
    .values({
      node_id: nodeReactionData.node_id,
      reactor_id: nodeReactionData.reactor_id,
      reaction: nodeReactionData.reaction,
      created_at: new Date(nodeReactionData.created_at),
      workspace_id: workspaceId,
      server_created_at: new Date(),
    })
    .onConflict((ob) => ob.doNothing())
    .execute();
};

const handleUpdateNodePermissionMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodePermissionData = JSON.parse(
    mutation.after,
  ) as LocalNodePermissionMutationData;

  const existingNodePermissions = await database
    .selectFrom('node_permissions')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodePermissionData.node_id),
        eb('collaborator_id', '=', nodePermissionData.collaborator_id),
      ]),
    )
    .executeTakeFirst();

  if (
    !existingNodePermissions ||
    existingNodePermissions.workspace_id != workspaceId ||
    existingNodePermissions.updated_at === null ||
    existingNodePermissions.updated_by === null
  ) {
    return;
  }

  if (existingNodePermissions.permission === nodePermissionData.permission) {
    return;
  }

  const updatedAt = new Date(existingNodePermissions.updated_at);
  if (existingNodePermissions.server_updated_at !== null) {
    const serverUpdatedAt = new Date(existingNodePermissions.server_updated_at);
    if (serverUpdatedAt > updatedAt) {
      return;
    }
  }

  await database
    .updateTable('node_permissions')
    .set({
      permission: nodePermissionData.permission,
      updated_at: updatedAt,
      updated_by:
        nodePermissionData.updated_by ?? existingNodePermissions.created_by,
      version_id: nodePermissionData.version_id,
      server_updated_at: new Date(),
    })
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodePermissionData.node_id),
        eb('collaborator_id', '=', nodePermissionData.collaborator_id),
      ]),
    )
    .execute();
};

const handleDeleteNodePermissionMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.before) {
    return;
  }

  const nodePermissionData = JSON.parse(
    mutation.before,
  ) as LocalNodePermissionMutationData;

  const existingNodePermissions = await database
    .selectFrom('node_permissions')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodePermissionData.node_id),
        eb('collaborator_id', '=', nodePermissionData.collaborator_id),
      ]),
    )
    .executeTakeFirst();

  if (
    !existingNodePermissions ||
    existingNodePermissions.workspace_id != workspaceId
  ) {
    return;
  }

  await database
    .deleteFrom('node_permissions')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodePermissionData.node_id),
        eb('collaborator_id', '=', nodePermissionData.collaborator_id),
      ]),
    )
    .execute();
};

const handleCreateNodeReactionMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodePermissionData = JSON.parse(
    mutation.after,
  ) as LocalNodePermissionMutationData;
  await database
    .insertInto('node_permissions')
    .values({
      node_id: nodePermissionData.node_id,
      collaborator_id: nodePermissionData.collaborator_id,
      permission: nodePermissionData.permission,
      workspace_id: workspaceId,
      created_at: new Date(nodePermissionData.created_at),
      created_by: nodePermissionData.created_by,
      server_created_at: new Date(),
      version_id: nodePermissionData.version_id,
    })
    .onConflict((ob) => ob.doNothing())
    .execute();
};

const handleDeleteNodeReactionMutation = async (
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.before) {
    return;
  }

  const nodeReactionData = JSON.parse(
    mutation.before,
  ) as LocalNodeReactionMutationData;

  await database
    .deleteFrom('node_reactions')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeReactionData.node_id),
        eb('reactor_id', '=', nodeReactionData.reactor_id),
        eb('reaction', '=', nodeReactionData.reaction),
      ]),
    )
    .execute();
};
