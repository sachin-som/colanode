import { NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import { ServerNode, ServerNodeReaction } from '@/types/nodes';
import { compareString } from '@/lib/utils';
import { mapNode } from '@/lib/nodes';

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

    const nodes: ServerNode[] = nodeRows
      .map((node) => mapNode(node))
      .sort((a, b) => compareString(a.id, b.id));

    const nodeReactions: ServerNodeReaction[] = nodeReactionRows.map(
      (nodeReaction) => {
        return {
          nodeId: nodeReaction.node_id,
          reactorId: nodeReaction.reactor_id,
          reaction: nodeReaction.reaction,
          workspaceId: nodeReaction.workspace_id,
          createdAt: nodeReaction.created_at,
          serverCreatedAt: nodeReaction.server_created_at,
        };
      },
    );

    res.status(200).json({
      nodes,
      nodeReactions,
    });
  },
);
