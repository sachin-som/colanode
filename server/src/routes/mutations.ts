import { NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  ExecuteLocalMutationsInput,
  LocalMutation,
  LocalNodeMutationData,
  LocalNodeReactionMutationData,
} from '@/types/mutations';
import { database } from '@/data/database';
import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';

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
        break;
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
        break;
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
