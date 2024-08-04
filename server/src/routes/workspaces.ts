import {
  Workspace,
  WorkspaceAccount,
  WorkspaceAccountStatus,
  WorkspaceInput,
  WorkspaceOutput,
  WorkspaceRole,
  WorkspaceStatus,
} from '@/types/workspaces';
import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { generateId, IdType } from '@/lib/id';
import { prisma } from '@/data/db';
import { Request, Response } from 'express';
import { Node } from '@/types/nodes';

const createWorkspace = async (req: NeuronRequest, res: NeuronResponse) => {
  const input: WorkspaceInput = req.body;

  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  if (!input.name) {
    return res.status(400).json({
      code: ApiError.MissingRequiredFields,
      message: 'Missing required fields.',
    });
  }

  const account = await prisma.accounts.findUnique({
    where: {
      id: req.accountId,
    },
  });

  if (!account) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Account not found.',
    });
  }

  const workspace: Workspace = {
    id: generateId(IdType.Workspace),
    name: input.name,
    description: input.description,
    avatar: input.avatar,
    createdAt: new Date(),
    createdBy: req.accountId,
    status: WorkspaceStatus.Active,
    versionId: generateId(IdType.Version),
  };

  const userNodeId = generateId(IdType.User);
  const workspaceAccount: WorkspaceAccount = {
    accountId: req.accountId,
    workspaceId: workspace.id,
    userNodeId: userNodeId,
    role: WorkspaceRole.Owner,
    createdAt: new Date(),
    createdBy: req.accountId,
    status: WorkspaceAccountStatus.Active,
    versionId: generateId(IdType.Version),
  };

  await prisma.$transaction([
    prisma.workspaces.create({
      data: workspace,
    }),
    prisma.nodes.create({
      data: {
        id: userNodeId,
        workspaceId: workspace.id,
        type: 'user',
        attrs: {
          id: account.id,
          name: account.name,
          avatar: account.avatar,
        },
        createdAt: new Date(),
        createdBy: userNodeId,
        versionId: generateId(IdType.Version),
      },
    }),
    prisma.workspaceAccounts.create({
      data: workspaceAccount,
    }),
  ]);

  const output: WorkspaceOutput = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    versionId: workspace.versionId,
    accountId: account.id,
    role: workspaceAccount.role,
    userNodeId: userNodeId,
  };

  return res.status(200).json(output);
};

const updateWorkspace = async (req: NeuronRequest, res: NeuronResponse) => {
  const id = req.params.id;
  const input: WorkspaceInput = req.body;

  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspace = await prisma.workspaces.findUnique({
    where: {
      id: id,
    },
  });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Workspace not found.',
    });
  }

  const workspaceAccount = await prisma.workspaceAccounts.findFirst({
    where: {
      workspaceId: id,
      accountId: req.accountId,
    },
  });

  if (!workspaceAccount) {
    return res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
  }

  if (workspaceAccount.role !== WorkspaceRole.Owner) {
    return res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
  }

  const updatedWorkspace = await prisma.workspaces.update({
    where: {
      id: id,
    },
    data: {
      name: input.name,
      updatedAt: new Date(),
      updatedBy: req.accountId,
    },
  });

  const output: WorkspaceOutput = {
    id: updatedWorkspace.id,
    name: updatedWorkspace.name,
    description: updatedWorkspace.description,
    avatar: updatedWorkspace.avatar,
    versionId: updatedWorkspace.versionId,
    accountId: req.accountId,
    role: workspaceAccount.role,
    userNodeId: workspaceAccount.userNodeId,
  };

  return res.status(200).json(output);
};

const deleteWorkspace = async (req: NeuronRequest, res: NeuronResponse) => {
  const id = req.params.id;

  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspace = await prisma.workspaces.findUnique({
    where: {
      id: id,
    },
  });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Workspace not found.',
    });
  }

  const workspaceAccount = await prisma.workspaceAccounts.findFirst({
    where: {
      workspaceId: id,
      accountId: req.accountId,
    },
  });

  if (!workspaceAccount) {
    return res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
  }

  await prisma.workspaces.delete({
    where: {
      id: id,
    },
  });

  return res.status(200).json({
    id: workspace.id,
  });
};

const getWorkspace = async (req: NeuronRequest, res: NeuronResponse) => {
  const id = req.params.id;

  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspace = await prisma.workspaces.findUnique({
    where: {
      id: id,
    },
  });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Workspace not found.',
    });
  }

  const workspaceAccount = await prisma.workspaceAccounts.findFirst({
    where: {
      workspaceId: id,
      accountId: req.accountId,
    },
  });

  if (!workspaceAccount) {
    return res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
  }

  const output: WorkspaceOutput = {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    versionId: workspace.versionId,
    accountId: req.accountId,
    role: workspaceAccount.role,
    userNodeId: workspaceAccount.userNodeId,
  };

  return res.status(200).json(output);
};

const getWorkspaces = async (req: NeuronRequest, res: NeuronResponse) => {
  if (!req.accountId) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
  }

  const workspaceAccounts = await prisma.workspaceAccounts.findMany({
    where: {
      accountId: req.accountId,
    },
  });

  const workspaceIds = workspaceAccounts.map((wa) => wa.workspaceId);
  const workspaces = await prisma.workspaces.findMany({
    where: {
      id: {
        in: workspaceIds,
      },
    },
  });

  const outputs: WorkspaceOutput[] = [];

  for (const workspace of workspaces) {
    const workspaceAccount = workspaceAccounts.find(
      (wa) => wa.workspaceId === workspace.id,
    );

    if (!workspaceAccount) {
      continue;
    }

    const output: WorkspaceOutput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.versionId,
      accountId: req.accountId,
      role: workspaceAccount.role,
      userNodeId: workspaceAccount.userNodeId,
    };

    outputs.push(output);
  }

  return res.status(200).json(outputs);
};

const getNodes = async (req: Request, res: Response) => {
  const workspaceId = req.params.id as string;
  const from = req.query.from as string;
  const nodes = await getNodesFromDatabase(workspaceId, from);
  const outputs: Node[] = nodes.map((node) => {
    return {
      id: node.id,
      parentId: node.parentId,
      workspaceId: node.workspaceId,
      type: node.type,
      attrs: node.attrs,
      createdAt: node.createdAt,
      createdBy: node.createdBy,
      versionId: node.versionId,
      content: node.content ? JSON.parse(node.content as string) : null,
      updatedAt: node.updatedAt,
      updatedBy: node.updatedBy,
    };
  });

  res.status(200).json({
    nodes: outputs,
  });
};

const getNodesFromDatabase = async (
  workspaceId: string,
  from?: string | null,
) => {
  if (from) {
    const date = new Date(from);
    return prisma.nodes.findMany({
      where: {
        workspaceId,
        OR: [
          {
            createdAt: {
              gte: date,
            },
          },
          {
            updatedAt: {
              gte: date,
            },
          },
        ],
      },
    });
  } else {
    return prisma.nodes.findMany({
      where: {
        workspaceId,
      },
    });
  }
};

export const workspaces = {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspace,
  getNodes,
};
