import {
  SynchronizerOutputMessage,
  SyncNodesInput,
  SyncNodeData,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

import { BaseSynchronizer } from '@/synchronizers/base';
import { Event } from '@/types/events';
import { database } from '@/data/database';
import { SelectNode } from '@/data/schema';

export class NodeSynchronizer extends BaseSynchronizer<SyncNodesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncNodesInput> | null> {
    const nodes = await this.fetchNodes();
    if (nodes.length === 0) {
      return null;
    }

    return this.buildMessage(nodes);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncNodesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const nodes = await this.fetchNodes();
    if (nodes.length === 0) {
      return null;
    }

    return this.buildMessage(nodes);
  }

  private async fetchNodes() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const nodes = await database
      .selectFrom('nodes')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('revision', '>', this.cursor)
      .orderBy('revision', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return nodes;
  }

  private buildMessage(
    unsyncedNodes: SelectNode[]
  ): SynchronizerOutputMessage<SyncNodesInput> {
    const items: SyncNodeData[] = unsyncedNodes.map((node) => {
      return {
        id: node.id,
        rootId: node.root_id,
        workspaceId: node.workspace_id,
        revision: node.revision.toString(),
        state: encodeState(node.state),
        createdAt: node.created_at.toISOString(),
        createdBy: node.created_by,
        updatedAt: node.updated_at?.toISOString() ?? null,
        updatedBy: node.updated_by,
      };
    });

    return {
      type: 'synchronizer_output',
      userId: this.user.userId,
      id: this.id,
      items: items.map((item) => ({
        cursor: item.revision,
        data: item,
      })),
    };
  }

  private shouldFetch(event: Event) {
    if (event.type === 'node_created' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'node_updated' && event.rootId === this.input.rootId) {
      return true;
    }

    if (event.type === 'node_deleted' && event.rootId === this.input.rootId) {
      return true;
    }

    return false;
  }
}
