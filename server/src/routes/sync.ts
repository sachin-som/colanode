import { NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import { ServerNode } from '@/types/nodes';

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

    res.status(200).json({
      nodes,
    });
  },
);
