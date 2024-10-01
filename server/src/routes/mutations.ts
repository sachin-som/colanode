import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { Router } from 'express';
import {
  ExecuteLocalMutationResult,
  ExecuteLocalMutationsInput,
  LocalMutation,
  ServerExecuteMutationResult,
} from '@/types/mutations';
import { handleNodeMutation } from '@/mutations/nodes';
import { handleNodeCollaboratorMutation } from '@/mutations/node-collaborators';
import { handleNodeReactionMutation } from '@/mutations/node-reactions';
import { database } from '@/data/database';
import { SelectWorkspaceAccount } from '@/data/schema';

export const mutationsRouter = Router();

mutationsRouter.post('/', async (req: NeuronRequest, res: NeuronResponse) => {
  const input = req.body as ExecuteLocalMutationsInput;
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
    .selectFrom('workspace_accounts')
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

  const results: ServerExecuteMutationResult[] = [];
  for (const mutation of input.mutations) {
    try {
      const result = await handleLocalMutation(workspaceAccount, mutation);
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

  res.status(200).json({ results });
});

const handleLocalMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  switch (mutation.table) {
    case 'nodes': {
      return handleNodeMutation(workspaceAccount, mutation);
    }
    case 'node_collaborators': {
      return handleNodeCollaboratorMutation(workspaceAccount, mutation);
    }
    case 'node_reactions': {
      return handleNodeReactionMutation(workspaceAccount, mutation);
    }
  }

  return {
    status: 'error',
  };
};
