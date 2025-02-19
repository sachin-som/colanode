import { UpdateMergeMetadata } from '@colanode/core';

export type SyncNodesUpdatesInput = {
  type: 'nodes_updates';
  rootId: string;
};

export type SyncNodeUpdateData = {
  id: string;
  nodeId: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  data: string;
  createdAt: string;
  createdBy: string;
  mergedUpdates: UpdateMergeMetadata[] | null | undefined;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    nodes_updates: {
      input: SyncNodesUpdatesInput;
      data: SyncNodeUpdateData;
    };
  }
}
