import {Request, Response} from "express";
import {WorkspaceInput} from "@/types/workspaces";
import {ApiError} from "@/types/api";
import {generateId, IdType} from "@/lib/id";
import {prisma} from "@/data/db";

async function createWorkspace(req: Request, res: Response) {
  const input: WorkspaceInput = req.body;

  if (!input.name) {
    return res.status(400).json({
      code: ApiError.MissingRequiredFields,
      message: "Missing required fields."
    });
  }

  const workspace = await prisma
    .workspaces
    .create({
      data: {
        id: generateId(IdType.Workspace),
        name: input.name,
        createdAt: new Date(),
        createdBy: 'user-id',
        status: 1,
      }
    });

  return res.json({
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt
  });
}

async function updateWorkspace(req: Request, res: Response) {
  const id = req.params.id;
  const input: WorkspaceInput = req.body;

  const workspace = await prisma
    .workspaces
    .findUnique({
      where: {
        id: id
      }
    });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: "Workspace not found."
    });
  }

  const updatedWorkspace = await prisma
    .workspaces
    .update({
      where: {
        id: id
      },
      data: {
        name: input.name,
        updatedAt: new Date(),
        updatedBy: 'user-id'
      }
    });

  return res.json({
    id: updatedWorkspace.id,
    name: updatedWorkspace.name,
    createdAt: updatedWorkspace.createdAt
  });
}

async function deleteWorkspace(req: Request, res: Response) {
  const id = req.params.id;

  const workspace = await prisma
    .workspaces
    .findUnique({
      where: {
        id: id
      }
    });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: "Workspace not found."
    });
  }

  await prisma
    .workspaces
    .delete({
      where: {
        id: id
      }
    });

  return res.json({
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt
  });
}

async function getWorkspace(req: Request, res: Response) {
  const id = req.params.id;

  const workspace = await prisma
    .workspaces
    .findUnique({
      where: {
        id: id
      }
    });

  if (!workspace) {
    return res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: "Workspace not found."
    });
  }

  return res.json({
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt
  });
}

export const workspaces = {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspace
}