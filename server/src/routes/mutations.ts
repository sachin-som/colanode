import { NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  LocalMutation,
  LocalCreateNodeMutation,
  LocalCreateNodesMutation,
  LocalUpdateNodeMutation,
  LocalDeleteNodeMutation,
  LocalDeleteNodesMutation,
  LocalCreateNodeData,
  ServerMutation,
  ServerCreateNodeMutation,
  ServerCreateNodesMutation,
  ServerUpdateNodeMutation,
  ServerDeleteNodeMutation,
  ServerDeleteNodesMutation,
} from '@/types/mutations';
import { prisma } from '@/data/prisma';
import { Node, NodeBlock } from '@/types/nodes';
import { Prisma } from '@prisma/client';
import { NeuronId } from '@/lib/id';

export const mutationsRouter = Router();

mutationsRouter.post('/', async (req: NeuronRequest, res: NeuronResponse) => {
  const localMutation = req.body as LocalMutation;

  switch (localMutation.type) {
    case 'create_node': {
      await handleCreateNodeMutation(req, res, localMutation);
      break;
    }
    case 'create_nodes': {
      await handleCreateNodesMutation(req, res, localMutation);
      break;
    }
    case 'update_node': {
      await handleUpdateNodeMutation(req, res, localMutation);
      break;
    }
    case 'delete_node': {
      await handleDeleteNodeMutation(req, res, localMutation);
      break;
    }
    case 'delete_nodes': {
      await handleDeleteNodesMutation(req, res, localMutation);
      break;
    }
  }
});

const handleCreateNodeMutation = async (
  req: NeuronRequest,
  res: NeuronResponse,
  localMutation: LocalCreateNodeMutation,
): Promise<NeuronResponse> => {
  if (!req.accountId) {
    return res.status(401).json({ success: false });
  }

  const existingNode = await prisma.nodes.findUnique({
    where: {
      id: localMutation.data.node.id,
    },
  });

  if (existingNode) {
    const serverMutation: ServerCreateNodeMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'create_node',
      workspaceId: localMutation.workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        node: {
          id: existingNode.id,
          parentId: existingNode.parentId,
          workspaceId: existingNode.workspaceId,
          type: existingNode.type,
          index: existingNode.index,
          attrs: existingNode.attrs as Record<string, any>,
          content: existingNode.content as NodeBlock[],
          createdAt: existingNode.createdAt?.toISOString(),
          createdBy: existingNode.createdBy,
          updatedAt: existingNode.updatedAt?.toISOString(),
          updatedBy: existingNode.updatedBy,
          versionId: existingNode.versionId,
          serverCreatedAt: existingNode.serverCreatedAt?.toISOString(),
          serverUpdatedAt: existingNode.serverUpdatedAt?.toISOString(),
          serverVersionId: existingNode.serverVersionId,
        },
      },
    };
    return res.status(200).json(serverMutation);
  }

  const node = buildNode(localMutation.data.node);
  const workspaceId = node.workspaceId;
  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId,
    },
  });

  if (workspaceAccounts.length === 0) {
    return res.status(401).json({ success: false });
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  if (!accountIds.includes(req.accountId)) {
    return res.status(401).json({ success: false });
  }

  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });
  const deviceIds = accountDevices.map((device) => device.id);

  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.nodes.create({
      data: {
        ...node,
        attrs: node.attrs === null ? Prisma.DbNull : node.attrs,
        content: node.content === null ? Prisma.DbNull : node.content,
      },
    });

    if (!row) {
      throw new Error('Failed to create node');
    }

    const serverMutation: ServerCreateNodeMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      workspaceId: localMutation.workspaceId,
      type: 'create_node',
      createdAt: new Date().toISOString(),
      data: {
        node: node,
      },
    };

    await prisma.mutations.create({
      data: {
        ...serverMutation,
        devices: deviceIds,
        deviceId: localMutation.deviceId,
      },
    });

    return serverMutation;
  });

  return res.status(200).json(result);
};

const handleCreateNodesMutation = async (
  req: NeuronRequest,
  res: NeuronResponse,
  localMutation: LocalCreateNodesMutation,
): Promise<NeuronResponse> => {
  if (!req.accountId) {
    return res.status(401).json({ success: false });
  }

  const existingNodes = await prisma.nodes.findMany({
    where: {
      id: {
        in: localMutation.data.nodes.map((node) => node.id),
      },
    },
  });

  const existingNodeIds = existingNodes.map((node) => node.id);
  if (existingNodeIds.length === localMutation.data.nodes.length) {
    const serverMutation: ServerCreateNodesMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'create_nodes',
      workspaceId: localMutation.workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        nodes: existingNodes.map((node) => ({
          id: node.id,
          parentId: node.parentId,
          workspaceId: node.workspaceId,
          type: node.type,
          index: node.index,
          attrs: node.attrs as Record<string, any>,
          content: node.content as NodeBlock[],
          createdAt: node.createdAt?.toISOString(),
          createdBy: node.createdBy,
          updatedAt: node.updatedAt?.toISOString(),
          updatedBy: node.updatedBy,
          versionId: node.versionId,
          serverCreatedAt: node.serverCreatedAt?.toISOString(),
          serverUpdatedAt: node.serverUpdatedAt?.toISOString(),
          serverVersionId: node.serverVersionId,
        })),
      },
    };
    return res.status(200).json(serverMutation);
  }

  const nodes = localMutation.data.nodes.map((node) => buildNode(node));

  const nodesToInsert = nodes.filter(
    (node) => !existingNodeIds.includes(node.id),
  );

  if (nodes.length === 0) {
    return res.status(400).json({ success: false });
  }

  const workspaceId = nodes[0].workspaceId;
  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId,
    },
  });

  if (workspaceAccounts.length === 0) {
    return res.status(401).json({ success: false });
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  if (!accountIds.includes(req.accountId)) {
    return res.status(401).json({ success: false });
  }

  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });
  const deviceIds = accountDevices.map((device) => device.id);

  const result = await prisma.$transaction(async (tx) => {
    const payload = await tx.nodes.createMany({
      data: nodesToInsert.map((node) => ({
        ...node,
        attrs: node.attrs === null ? Prisma.DbNull : node.attrs,
        content: node.content === null ? Prisma.DbNull : node.content,
      })),
    });

    if (payload.count !== nodes.length) {
      throw new Error('Failed to create nodes');
    }

    const serverMutation: ServerCreateNodesMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'create_nodes',
      workspaceId: workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        nodes,
      },
    };

    await tx.mutations.create({
      data: {
        ...serverMutation,
        devices: deviceIds,
        deviceId: localMutation.deviceId,
      },
    });

    return serverMutation;
  });

  return res.status(200).json(result);
};

const handleUpdateNodeMutation = async (
  req: NeuronRequest,
  res: NeuronResponse,
  localMutation: LocalUpdateNodeMutation,
): Promise<NeuronResponse> => {
  if (!req.accountId) {
    return res.status(401).json({ success: false });
  }

  const id = localMutation.data.id;
  const existingNode = await prisma.nodes.findUnique({
    where: {
      id,
    },
  });

  if (!existingNode) {
    return res.status(404).json({ success: false });
  }

  const workspaceId = existingNode.workspaceId;
  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId,
    },
  });

  if (workspaceAccounts.length === 0) {
    return res.status(401).json({ success: false });
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  if (!accountIds.includes(req.accountId)) {
    return res.status(401).json({ success: false });
  }

  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });
  const deviceIds = accountDevices.map((device) => device.id);

  const data = localMutation.data;
  const result = await prisma.$transaction(async (tx) => {
    const row = await tx.nodes.update({
      where: {
        id,
      },
      data: {
        type: data.type,
        parentId: data.parentId,
        index: data.index,
        content: data.content ? data.content : Prisma.DbNull,
        attrs: data.attrs ? data.attrs : Prisma.DbNull,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
        versionId: data.versionId,
        serverUpdatedAt: new Date().toISOString(),
        serverVersionId: data.versionId,
      },
    });

    if (!row) {
      throw new Error('Failed to update node');
    }

    const node: Node = {
      id: row.id,
      parentId: row.parentId,
      workspaceId: row.workspaceId,
      type: row.type,
      index: row.index,
      attrs: row.attrs as Record<string, any>,
      content: row.content as NodeBlock[],
      createdAt: row.createdAt?.toISOString(),
      createdBy: row.createdBy,
      updatedAt: row.updatedAt?.toISOString(),
      updatedBy: row.updatedBy,
      versionId: row.versionId,
      serverCreatedAt: row.serverCreatedAt?.toISOString(),
      serverUpdatedAt: row.serverUpdatedAt?.toISOString(),
      serverVersionId: row.serverVersionId,
    };

    const serverMutation: ServerUpdateNodeMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'update_node',
      workspaceId: workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        node: node,
      },
    };

    await tx.mutations.create({
      data: {
        ...serverMutation,
        devices: deviceIds,
        deviceId: localMutation.deviceId,
      },
    });

    return serverMutation;
  });

  return res.status(200).json(result);
};

const handleDeleteNodeMutation = async (
  req: NeuronRequest,
  res: NeuronResponse,
  localMutation: LocalDeleteNodeMutation,
): Promise<NeuronResponse> => {
  if (!req.accountId) {
    return res.status(401).json({ success: false });
  }

  const id = localMutation.data.id;
  const existingNode = await prisma.nodes.findUnique({
    where: {
      id,
    },
  });

  if (!existingNode) {
    const serverMutation: ServerMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'delete_node',
      workspaceId: localMutation.workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        id,
      },
    };
    return res.status(200).json(serverMutation);
  }

  const workspaceId = existingNode.workspaceId;
  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId,
    },
  });

  if (workspaceAccounts.length === 0) {
    return res.status(401).json({ success: false });
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  if (!accountIds.includes(req.accountId)) {
    return res.status(401).json({ success: false });
  }

  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });
  const deviceIds = accountDevices.map((device) => device.id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.nodes.delete({
      where: {
        id,
      },
    });

    const serverMutation: ServerDeleteNodeMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'delete_node',
      workspaceId: workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        id,
      },
    };

    await tx.mutations.create({
      data: {
        ...serverMutation,
        devices: deviceIds,
        deviceId: localMutation.deviceId,
      },
    });
  });

  return res.status(200).json(result);
};

const handleDeleteNodesMutation = async (
  req: NeuronRequest,
  res: NeuronResponse,
  localMutation: LocalDeleteNodesMutation,
): Promise<NeuronResponse> => {
  if (!req.accountId) {
    return res.status(401).json({ success: false });
  }

  const ids = localMutation.data.ids;
  const existingNodes = await prisma.nodes.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  const nodesToDelete = existingNodes.map((node) => node.id);
  if (nodesToDelete.length === 0) {
    const serverMutation: ServerDeleteNodesMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'delete_nodes',
      workspaceId: localMutation.workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        ids,
      },
    };
    return res.status(200).json(serverMutation);
  }

  const workspaceId = existingNodes[0].workspaceId;
  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      workspaceId,
    },
  });

  if (workspaceAccounts.length === 0) {
    return res.status(401).json({ success: false });
  }

  const accountIds = workspaceAccounts.map((account) => account.accountId);
  if (!accountIds.includes(req.accountId)) {
    return res.status(401).json({ success: false });
  }

  const accountDevices = await prisma.accountDevices.findMany({
    where: {
      accountId: {
        in: accountIds,
      },
    },
  });
  const deviceIds = accountDevices.map((device) => device.id);

  const result = await prisma.$transaction(async (tx) => {
    await tx.nodes.deleteMany({
      where: {
        id: {
          in: nodesToDelete,
        },
      },
    });

    const serverMutation: ServerDeleteNodesMutation = {
      id: NeuronId.generate(NeuronId.Type.Mutation),
      type: 'delete_nodes',
      workspaceId: workspaceId,
      createdAt: new Date().toISOString(),
      data: {
        ids,
      },
    };

    await tx.mutations.create({
      data: {
        ...serverMutation,
        devices: deviceIds,
        deviceId: localMutation.deviceId,
      },
    });
  });

  return res.status(200).json(result);
};

const buildNode = (data: LocalCreateNodeData): Node => {
  return {
    id: data.id,
    parentId: data.parentId,
    workspaceId: data.workspaceId,
    type: data.type,
    index: data.index,
    attrs: data.attrs as Record<string, any>,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    versionId: data.versionId,
    content: data.content as NodeBlock[],
    serverCreatedAt: new Date().toISOString(),
    serverVersionId: data.versionId,
  };
};
