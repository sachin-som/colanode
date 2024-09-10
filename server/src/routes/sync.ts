import { NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import { ServerNode, ServerNodeAttribute } from '@/types/nodes';

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

    const nodeAttributeRows = await database
      .selectFrom('node_attributes')
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
        createdAt: node.created_at.toISOString(),
        createdBy: node.created_by,
        versionId: node.version_id,
        content: node.content,
        updatedAt: node.updated_at?.toISOString(),
        updatedBy: node.updated_by,
        serverCreatedAt: node.server_created_at.toISOString(),
        serverUpdatedAt: node.server_updated_at?.toISOString(),
      };
    });

    const nodeAttributes: ServerNodeAttribute[] = nodeAttributeRows.map(
      (nodeAttribute) => {
        return {
          nodeId: nodeAttribute.node_id,
          type: nodeAttribute.type,
          key: nodeAttribute.key,
          textValue: nodeAttribute.text_value,
          numberValue: nodeAttribute.number_value,
          foreignNodeId: nodeAttribute.foreign_node_id,
          workspaceId: nodeAttribute.workspace_id,
          createdAt: nodeAttribute.created_at.toISOString(),
          createdBy: nodeAttribute.created_by,
          versionId: nodeAttribute.version_id,
          serverCreatedAt: nodeAttribute.server_created_at.toISOString(),
          serverUpdatedAt: nodeAttribute.server_updated_at?.toISOString(),
        };
      },
    );

    res.status(200).json({
      nodes,
      nodeAttributes,
    });
  },
);
