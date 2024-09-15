import { NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  ExecuteLocalMutationsInput,
  LocalMutation,
  LocalNodeAttributeMutationData,
  LocalNodeMutationData,
  LocalNodeReactionMutationData,
} from '@/types/mutations';
import { database } from '@/data/database';

export const mutationsRouter = Router();

mutationsRouter.post('/', async (req: NeuronRequest, res: NeuronResponse) => {
  const input = req.body as ExecuteLocalMutationsInput;
  for (const mutation of input.mutations) {
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
      }
      case 'node_attributes': {
        switch (mutation.action) {
          case 'insert': {
            await handleCreateNodeAttributeMutation(
              input.workspaceId,
              mutation,
            );
            break;
          }
          case 'update': {
            await handleUpdateNodeAttributeMutation(
              input.workspaceId,
              mutation,
            );
            break;
          }
          case 'delete': {
            await handleDeleteNodeAttributeMutation(
              input.workspaceId,
              mutation,
            );
            break;
          }
        }
      }
      case 'node_reactions': {
        switch (mutation.action) {
          case 'insert': {
            await handleCreateNodeReactionMutation(input.workspaceId, mutation);
            break;
          }
          case 'delete': {
            await handleDeleteNodeReactionMutation(mutation);
            break;
          }
        }
      }
    }
  }

  res.status(200).json({ success: true });
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
      parent_id: nodeData.parent_id,
      workspace_id: workspaceId,
      type: nodeData.type,
      index: nodeData.index,
      content: nodeData.content,
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
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (!existingNode) {
    return;
  }

  const updatedAt = nodeData.updated_at
    ? new Date(nodeData.updated_at)
    : new Date();
  const updatedBy = nodeData.updated_by ?? nodeData.created_by;

  await database
    .updateTable('nodes')
    .set({
      parent_id: nodeData.parent_id,
      type: nodeData.type,
      index: nodeData.index,
      content: nodeData.content,
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

const handleCreateNodeAttributeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodeAttributeData = JSON.parse(
    mutation.after,
  ) as LocalNodeAttributeMutationData;
  const existingNodeAttribute = await database
    .selectFrom('node_attributes')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeAttributeData.node_id),
        eb('type', '=', nodeAttributeData.type),
        eb('key', '=', nodeAttributeData.key),
      ]),
    )
    .executeTakeFirst();

  if (existingNodeAttribute) {
    return;
  }

  await database
    .insertInto('node_attributes')
    .values({
      node_id: nodeAttributeData.node_id,
      type: nodeAttributeData.type,
      key: nodeAttributeData.key,
      workspace_id: workspaceId,
      text_value: nodeAttributeData.text_value,
      number_value: nodeAttributeData.number_value,
      foreign_node_id: nodeAttributeData.foreign_node_id,
      created_at: new Date(nodeAttributeData.created_at),
      created_by: nodeAttributeData.created_by,
      version_id: nodeAttributeData.version_id,
      server_created_at: new Date(),
    })
    .execute();
};

const handleUpdateNodeAttributeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.after) {
    return;
  }

  const nodeAttributeData = JSON.parse(
    mutation.after,
  ) as LocalNodeAttributeMutationData;
  const existingNodeAttribute = await database
    .selectFrom('node_attributes')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeAttributeData.node_id),
        eb('type', '=', nodeAttributeData.type),
        eb('key', '=', nodeAttributeData.key),
      ]),
    )
    .executeTakeFirst();

  if (!existingNodeAttribute) {
    return;
  }

  const updatedAt = nodeAttributeData.updated_at
    ? new Date(nodeAttributeData.updated_at)
    : new Date();

  const updatedBy =
    nodeAttributeData.updated_by ?? nodeAttributeData.created_by;

  await database
    .updateTable('node_attributes')
    .set({
      text_value: nodeAttributeData.text_value,
      number_value: nodeAttributeData.number_value,
      foreign_node_id: nodeAttributeData.foreign_node_id,
      updated_at: updatedAt,
      updated_by: updatedBy,
      version_id: nodeAttributeData.version_id,
      server_updated_at: new Date(),
    })
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeAttributeData.node_id),
        eb('type', '=', nodeAttributeData.type),
        eb('key', '=', nodeAttributeData.key),
      ]),
    )
    .execute();
};

const handleDeleteNodeAttributeMutation = async (
  workspaceId: string,
  mutation: LocalMutation,
): Promise<void> => {
  if (!mutation.before) {
    return;
  }

  const nodeAttributeData = JSON.parse(
    mutation.before,
  ) as LocalNodeAttributeMutationData;
  const existingNodeAttribute = await database
    .selectFrom('node_attributes')
    .selectAll()
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeAttributeData.node_id),
        eb('type', '=', nodeAttributeData.type),
        eb('key', '=', nodeAttributeData.key),
      ]),
    )
    .executeTakeFirst();

  if (
    !existingNodeAttribute ||
    existingNodeAttribute.workspace_id !== workspaceId
  ) {
    return;
  }

  await database
    .deleteFrom('node_attributes')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeAttributeData.node_id),
        eb('type', '=', nodeAttributeData.type),
        eb('key', '=', nodeAttributeData.key),
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
