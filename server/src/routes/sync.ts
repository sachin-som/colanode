import { NeuronRequest, NeuronResponse } from '@/types/api';
import { prisma } from '@/data/prisma';
import { Router } from 'express';
import { Node, NodeBlock } from '@/types/nodes';

export const syncRouter = Router();

syncRouter.get(
  '/:workspaceId/sync',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const nodes = await prisma.nodes.findMany({
      where: {
        workspaceId,
      },
    });

    const outputs: Node[] = nodes.map((node) => {
      return {
        id: node.id,
        parentId: node.parentId,
        workspaceId: node.workspaceId,
        type: node.type,
        index: node.index,
        attrs: node.attrs as Record<string, any>,
        createdAt: node.createdAt.toISOString(),
        createdBy: node.createdBy,
        versionId: node.versionId,
        content: node.content as NodeBlock[],
        updatedAt: node.updatedAt?.toISOString(),
        updatedBy: node.updatedBy,
        serverCreatedAt: node.serverCreatedAt.toISOString(),
        serverUpdatedAt: node.serverUpdatedAt?.toISOString(),
        serverVersionId: node.serverVersionId,
      };
    });

    res.status(200).json({
      nodes: outputs,
    });
  },
);
