import { NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  ExecuteLocalMutationsInput,
  LocalMutation,
  LocalNodeMutationData,
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
      attrs: nodeData.attrs,
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
      attrs: nodeData.attrs,
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
