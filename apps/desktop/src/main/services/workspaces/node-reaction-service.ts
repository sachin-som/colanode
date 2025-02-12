import {
  canCreateNodeReaction,
  createDebugger,
  CreateNodeReactionMutation,
  CreateNodeReactionMutationData,
  DeleteNodeReactionMutation,
  DeleteNodeReactionMutationData,
  generateId,
  IdType,
  SyncNodeReactionData,
} from '@colanode/core';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { eventBus } from '@/shared/lib/event-bus';
import { mapNode, mapNodeReaction } from '@/main/lib/mappers';
import { SelectNodeReaction } from '@/main/databases/workspace';
import { MutationErrorCode, MutationError } from '@/shared/mutations';
import { fetchNode } from '@/main/lib/utils';

export class NodeReactionService {
  private readonly debug = createDebugger('desktop:service:node-reaction');
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async createNodeReaction(nodeId: string, reaction: string) {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (!node) {
      throw new MutationError(
        MutationErrorCode.NodeNotFound,
        'Node not found or has been deleted.'
      );
    }

    const existingNodeReaction = await this.workspace.database
      .selectFrom('node_reactions')
      .selectAll()
      .where('node_id', '=', nodeId)
      .where('collaborator_id', '=', this.workspace.userId)
      .where('reaction', '=', reaction)
      .executeTakeFirst();

    if (existingNodeReaction) {
      return {
        success: true,
      };
    }

    const root = await fetchNode(this.workspace.database, node.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canCreateNodeReaction({
        user: {
          userId: this.workspace.userId,
          role: this.workspace.role,
        },
        node: mapNode(node),
        root: mapNode(root),
      })
    ) {
      throw new MutationError(
        MutationErrorCode.NodeReactionCreateForbidden,
        "You don't have permission to react to this node."
      );
    }

    const tombstoneId = this.generateTombstoneId(nodeId, reaction);
    const { createdNodeReaction, createdMutation } =
      await this.workspace.database.transaction().execute(async (trx) => {
        const createdNodeReaction = await trx
          .insertInto('node_reactions')
          .returningAll()
          .values({
            node_id: nodeId,
            collaborator_id: this.workspace.userId,
            reaction,
            root_id: node.root_id,
            revision: 0n,
            created_at: new Date().toISOString(),
          })
          .onConflict((cb) => cb.doNothing())
          .executeTakeFirst();

        if (!createdNodeReaction) {
          throw new Error('Failed to create node reaction');
        }

        const mutation: CreateNodeReactionMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'create_node_reaction',
          data: {
            nodeId,
            reaction,
            rootId: node.root_id,
            createdAt: new Date().toISOString(),
          },
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: mutation.id,
            type: mutation.type,
            data: JSON.stringify(mutation.data),
            created_at: mutation.createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        await trx
          .deleteFrom('tombstones')
          .where('id', '=', tombstoneId)
          .execute();

        return {
          createdNodeReaction,
          createdMutation,
        };
      });

    if (!createdNodeReaction || !createdMutation) {
      throw new Error('Failed to create node reaction');
    }

    this.workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'node_reaction_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeReaction: mapNodeReaction(createdNodeReaction),
    });
  }

  public async deleteNodeReaction(nodeId: string, reaction: string) {
    const existingNodeReaction = await this.workspace.database
      .selectFrom('node_reactions')
      .selectAll()
      .where('node_id', '=', nodeId)
      .where('collaborator_id', '=', this.workspace.userId)
      .where('reaction', '=', reaction)
      .executeTakeFirst();

    if (!existingNodeReaction) {
      return {
        success: true,
      };
    }

    const tombstoneId = this.generateTombstoneId(nodeId, reaction);
    const { deletedNodeReaction, createdMutation } =
      await this.workspace.database.transaction().execute(async (trx) => {
        const deletedNodeReaction = await trx
          .deleteFrom('node_reactions')
          .returningAll()
          .where('node_id', '=', nodeId)
          .where('collaborator_id', '=', this.workspace.userId)
          .where('reaction', '=', reaction)
          .executeTakeFirst();

        if (!deletedNodeReaction) {
          throw new Error('Failed to delete node reaction');
        }

        const mutation: DeleteNodeReactionMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'delete_node_reaction',
          data: {
            nodeId,
            reaction,
            rootId: existingNodeReaction.root_id,
            deletedAt: new Date().toISOString(),
          },
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: mutation.id,
            type: mutation.type,
            data: JSON.stringify(mutation.data),
            created_at: mutation.createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create node reaction mutation');
        }

        await trx
          .insertInto('tombstones')
          .values({
            id: tombstoneId,
            data: JSON.stringify(deletedNodeReaction),
            deleted_at: new Date().toISOString(),
          })
          .executeTakeFirst();

        return {
          deletedNodeReaction,
          createdMutation,
        };
      });

    if (!deletedNodeReaction || !createdMutation) {
      throw new Error('Failed to delete node reaction');
    }

    this.workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'node_reaction_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeReaction: mapNodeReaction(deletedNodeReaction),
    });
  }

  public async syncServerNodeReaction(nodeReaction: SyncNodeReactionData) {
    if (nodeReaction.deletedAt) {
      const deletedNodeReaction = await this.workspace.database
        .deleteFrom('node_reactions')
        .returningAll()
        .where('node_id', '=', nodeReaction.nodeId)
        .where('collaborator_id', '=', nodeReaction.collaboratorId)
        .where('reaction', '=', nodeReaction.reaction)
        .executeTakeFirst();

      if (deletedNodeReaction) {
        eventBus.publish({
          type: 'node_reaction_deleted',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          nodeReaction: mapNodeReaction(deletedNodeReaction),
        });
      }

      this.debug(
        `Server node reaction for node ${nodeReaction.nodeId} has been synced`
      );
      return;
    }

    const existingNodeReaction = await this.workspace.database
      .selectFrom('node_reactions')
      .selectAll()
      .where('node_id', '=', nodeReaction.nodeId)
      .where('collaborator_id', '=', nodeReaction.collaboratorId)
      .where('reaction', '=', nodeReaction.reaction)
      .executeTakeFirst();

    const revision = BigInt(nodeReaction.revision);
    if (existingNodeReaction) {
      if (existingNodeReaction.revision === revision) {
        this.debug(
          `Server node reaction for node ${nodeReaction.nodeId} is already synced`
        );
        return;
      }

      const updatedNodeReaction = await this.workspace.database
        .updateTable('node_reactions')
        .returningAll()
        .set({
          revision,
        })
        .where('node_id', '=', nodeReaction.nodeId)
        .where('collaborator_id', '=', nodeReaction.collaboratorId)
        .where('reaction', '=', nodeReaction.reaction)
        .executeTakeFirst();

      if (!updatedNodeReaction) {
        return;
      }

      this.debug(
        `Server node reaction for node ${nodeReaction.nodeId} has been synced`
      );
      return;
    }

    const createdNodeReaction = await this.workspace.database
      .insertInto('node_reactions')
      .returningAll()
      .values({
        node_id: nodeReaction.nodeId,
        collaborator_id: nodeReaction.collaboratorId,
        reaction: nodeReaction.reaction,
        root_id: nodeReaction.rootId,
        created_at: nodeReaction.createdAt,
        revision,
      })
      .onConflict((b) =>
        b.columns(['node_id', 'collaborator_id', 'reaction']).doUpdateSet({
          revision,
        })
      )
      .executeTakeFirst();

    if (!createdNodeReaction) {
      return;
    }

    eventBus.publish({
      type: 'node_reaction_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeReaction: mapNodeReaction(createdNodeReaction),
    });

    this.debug(
      `Server node reaction for node ${nodeReaction.nodeId} has been synced`
    );
  }

  public async revertNodeReactionCreate(
    nodeReaction: CreateNodeReactionMutationData
  ) {
    const deletedNodeReaction = await this.workspace.database
      .deleteFrom('node_reactions')
      .returningAll()
      .where('node_id', '=', nodeReaction.nodeId)
      .where('collaborator_id', '=', this.workspace.userId)
      .where('reaction', '=', nodeReaction.reaction)
      .executeTakeFirst();

    if (!deletedNodeReaction) {
      return;
    }

    eventBus.publish({
      type: 'node_reaction_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeReaction: mapNodeReaction(deletedNodeReaction),
    });
  }

  public async revertNodeReactionDelete(
    nodeReaction: DeleteNodeReactionMutationData
  ) {
    const tombstoneId = this.generateTombstoneId(
      nodeReaction.nodeId,
      nodeReaction.reaction
    );
    const tombstone = await this.workspace.database
      .selectFrom('tombstones')
      .selectAll()
      .where('id', '=', tombstoneId)
      .executeTakeFirst();

    if (!tombstone) {
      return;
    }

    const data = JSON.parse(tombstone.data) as SelectNodeReaction;
    const createdNodeReaction = await this.workspace.database
      .insertInto('node_reactions')
      .returningAll()
      .values({
        node_id: data.node_id,
        collaborator_id: data.collaborator_id,
        reaction: data.reaction,
        root_id: data.root_id,
        created_at: data.created_at,
        revision: data.revision,
      })
      .onConflict((b) =>
        b.columns(['node_id', 'collaborator_id', 'reaction']).doUpdateSet({
          revision: data.revision,
        })
      )
      .executeTakeFirst();

    if (!createdNodeReaction) {
      return;
    }

    eventBus.publish({
      type: 'node_reaction_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeReaction: mapNodeReaction(createdNodeReaction),
    });
  }

  private generateTombstoneId(nodeId: string, reaction: string) {
    return `${nodeId}-${reaction}`;
  }
}
