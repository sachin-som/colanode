import { database, hasInsertChanges, hasDeleteChanges } from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { generateId, IdType } from '@/lib/id';
import { fetchCollaboratorRole } from '@/lib/nodes';
import { enqueueChange } from '@/queues/changes';
import {
  SyncLocalChangeResult,
  LocalChange,
  LocalNodeReactionChangeData,
  ServerNodeReactionCreateChangeData,
  ServerNodeReactionDeleteChangeData,
} from '@/types/sync';

export const handleNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  mutation: LocalChange,
): Promise<SyncLocalChangeResult> => {
  switch (mutation.action) {
    case 'insert': {
      return handleCreateNodeReactionChange(workspaceUser, mutation);
    }
    case 'delete': {
      return handleDeleteNodeReactionChange(workspaceUser, mutation);
    }
  }

  return {
    status: 'error',
  };
};

const handleCreateNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    change.after,
  ) as LocalNodeReactionChangeData;

  if (nodeReactionData.actor_id !== workspaceUser.id) {
    return {
      status: 'error',
    };
  }

  const nodeRole = await fetchCollaboratorRole(
    nodeReactionData.node_id,
    workspaceUser.id,
  );

  if (nodeRole === null) {
    return {
      status: 'error',
    };
  }

  const serverCreatedAt = new Date();
  const changeId = generateId(IdType.Change);
  const changeData: ServerNodeReactionCreateChangeData = {
    type: 'node_reaction_create',
    nodeId: nodeReactionData.node_id,
    actorId: nodeReactionData.actor_id,
    reaction: nodeReactionData.reaction,
    createdAt: nodeReactionData.created_at,
    serverCreatedAt: serverCreatedAt.toISOString(),
  };

  await database.transaction().execute(async (trx) => {
    const result = await database
      .insertInto('node_reactions')
      .values({
        node_id: nodeReactionData.node_id,
        actor_id: nodeReactionData.actor_id,
        reaction: nodeReactionData.reaction,
        created_at: new Date(nodeReactionData.created_at),
        workspace_id: workspaceUser.workspace_id,
        server_created_at: new Date(),
      })
      .onConflict((ob) => ob.doNothing())
      .execute();

    if (!hasInsertChanges(result)) {
      return;
    }

    await trx
      .insertInto('changes')
      .values({
        id: changeId,
        workspace_id: workspaceUser.workspace_id,
        data: JSON.stringify(changeData),
        created_at: new Date(),
      })
      .execute();
  });

  await enqueueChange(changeId);

  return {
    status: 'success',
  };
};

const handleDeleteNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.before) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    change.before,
  ) as LocalNodeReactionChangeData;

  if (nodeReactionData.actor_id !== workspaceUser.id) {
    return {
      status: 'error',
    };
  }

  const changeId = generateId(IdType.Change);
  const changeData: ServerNodeReactionDeleteChangeData = {
    type: 'node_reaction_delete',
    nodeId: nodeReactionData.node_id,
    actorId: nodeReactionData.actor_id,
    reaction: nodeReactionData.reaction,
  };

  await database.transaction().execute(async (trx) => {
    const result = await trx
      .deleteFrom('node_reactions')
      .where((eb) =>
        eb.and([
          eb('node_id', '=', nodeReactionData.node_id),
          eb('actor_id', '=', nodeReactionData.actor_id),
          eb('reaction', '=', nodeReactionData.reaction),
        ]),
      )
      .execute();

    if (!hasDeleteChanges(result)) {
      return;
    }

    await trx
      .insertInto('changes')
      .values({
        id: changeId,
        workspace_id: workspaceUser.workspace_id,
        data: JSON.stringify(changeData),
        created_at: new Date(),
      })
      .execute();
  });

  await enqueueChange(changeId);

  return {
    status: 'success',
  };
};
