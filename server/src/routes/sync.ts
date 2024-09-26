import { NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import { ServerNode, ServerNodeReaction } from '@/types/nodes';

export const syncRouter = Router();

syncRouter.get(
  '/:workspaceId/sync',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const nodeRows = await database
      .selectFrom('nodes')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .execute();

    const nodeReactionRows = await database
      .selectFrom('node_reactions')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .execute();

    const nodes: ServerNode[] = nodeRows.map((node) => {
      return {
        id: node.id,
        parentId: node.parent_id,
        workspaceId: node.workspace_id,
        type: node.type,
        index: node.index,
        attributes: node.attributes,
        state: node.state,
        createdAt: node.created_at.toISOString(),
        createdBy: node.created_by,
        versionId: node.version_id,
        updatedAt: node.updated_at?.toISOString(),
        updatedBy: node.updated_by,
        serverCreatedAt: node.server_created_at.toISOString(),
        serverUpdatedAt: node.server_updated_at?.toISOString(),
      };
    });

    const nodeReactions: ServerNodeReaction[] = nodeReactionRows.map(
      (nodeReaction) => {
        return {
          nodeId: nodeReaction.node_id,
          reactorId: nodeReaction.reactor_id,
          reaction: nodeReaction.reaction,
          workspaceId: nodeReaction.workspace_id,
          createdAt: nodeReaction.created_at.toISOString(),
          serverCreatedAt: nodeReaction.server_created_at.toISOString(),
        };
      },
    );

    res.status(200).json({
      nodes,
      nodeReactions,
    });
  },
);
