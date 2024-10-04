import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import {
  ServerNode,
  ServerNodeCollaborator,
  ServerNodeReaction,
} from '@/types/nodes';
import { compareString } from '@/lib/utils';
import { mapNode } from '@/lib/nodes';
import {
  LocalChange,
  ServerSyncChangeResult,
  SyncLocalChangeResult,
  SyncLocalChangesInput,
} from '@/types/sync';
import { SelectWorkspaceUser } from '@/data/schema';
import { handleNodeChange } from '@/sync/nodes';
import { handleNodeCollaboratorChange } from '@/sync/node-collaborators';
import { handleNodeReactionChange } from '@/sync/node-reactions';

export const syncRouter = Router();

syncRouter.get(
  '/:workspaceId',
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

    const nodeCollaboratorRows = await database
      .selectFrom('node_collaborators')
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
          reactorId: nodeReaction.actor_id,
          reaction: nodeReaction.reaction,
          workspaceId: nodeReaction.workspace_id,
          createdAt: nodeReaction.created_at,
          serverCreatedAt: nodeReaction.server_created_at,
        };
      },
    );

    const nodeCollaborators: ServerNodeCollaborator[] =
      nodeCollaboratorRows.map((nodeCollaborator) => {
        return {
          nodeId: nodeCollaborator.node_id,
          collaboratorId: nodeCollaborator.collaborator_id,
          role: nodeCollaborator.role,
          workspaceId: nodeCollaborator.workspace_id,
          createdAt: nodeCollaborator.created_at,
          createdBy: nodeCollaborator.created_by,
          updatedAt: nodeCollaborator.updated_at,
          updatedBy: nodeCollaborator.updated_by,
          versionId: nodeCollaborator.version_id,
          serverCreatedAt: nodeCollaborator.server_created_at,
          serverUpdatedAt: nodeCollaborator.server_created_at,
        };
      });

    res.status(200).json({
      nodes,
      nodeReactions,
      nodeCollabors: nodeCollaborators,
    });
  },
);

syncRouter.post(
  '/:workspaceId',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const input = req.body as SyncLocalChangesInput;
    if (!req.accountId) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', input.workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceAccount = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.accountId)
      .executeTakeFirst();

    if (!workspaceAccount) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const results: ServerSyncChangeResult[] = [];
    for (const mutation of input.changes) {
      try {
        const result = await handleLocalChange(workspaceAccount, mutation);
        results.push({
          id: mutation.id,
          status: result.status,
        });
      } catch (error) {
        results.push({
          id: mutation.id,
          status: 'error',
        });
      }
    }

    console.log('executed mutations', results);
    res.status(200).json({ results });
  },
);

const handleLocalChange = async (
  workspaceUser: SelectWorkspaceUser,
  mutation: LocalChange,
): Promise<SyncLocalChangeResult> => {
  switch (mutation.table) {
    case 'nodes': {
      return handleNodeChange(workspaceUser, mutation);
    }
    case 'node_collaborators': {
      return handleNodeCollaboratorChange(workspaceUser, mutation);
    }
    case 'node_reactions': {
      return handleNodeReactionChange(workspaceUser, mutation);
    }
  }

  return {
    status: 'error',
  };
};
