import { Workspace } from '@/types/workspaces';
import { Transaction } from '@/types/transactions';
import { Account } from '@/types/accounts';
import { CreateNodeInput, Node, UpdateNodeInput } from '@/types/nodes';
import { GlobalDatabaseData } from '@/types/global';
import { EventBus } from '@/lib/event-bus';

export interface GlobalDbApi {
  init: () => Promise<GlobalDatabaseData>;
  getAccounts: () => Promise<Account[]>;
  addAccount: (account: Account) => Promise<void>;
  getWorkspaces: () => Promise<Workspace[]>;
  addWorkspace: (workspace: Workspace) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
}

export interface WorkspaceDbApi {
  createNode: (
    accountId: string,
    workspaceId: string,
    input: CreateNodeInput,
  ) => Promise<void>;
  createNodes: (
    accountId: string,
    workspaceId: string,
    inputs: CreateNodeInput[],
  ) => Promise<void>;
  getNodes: (accountId: string, workspaceId: string) => Promise<Node[]>;
  updateNode: (
    accountId: string,
    workspaceId: string,
    input: UpdateNodeInput,
  ) => Promise<void>;
  deleteNode: (
    accountId: string,
    workspaceId: string,
    nodeId: string,
  ) => Promise<void>;
  deleteNodes: (
    accountId: string,
    workspaceId: string,
    nodeIds: string[],
  ) => Promise<void>;

  getSidebarNodes: (accountId: string, workspaceId: string) => Promise<Node[]>;

  getConversationNodes: (
    accountId: string,
    workspaceId: string,
    conversationId: string,
    count: number,
    after?: string | null,
  ) => Promise<Node[]>;

  getDocumentNodes: (
    accountId: string,
    workspaceId: string,
    documentId: string,
  ) => Promise<Node[]>;

  getContainerNodes: (
    accountId: string,
    workspaceId: string,
    containerId: string,
  ) => Promise<Node[]>;
}

declare global {
  interface Window {
    globalDb: GlobalDbApi;
    workspaceDb: WorkspaceDbApi;
    eventBus: EventBus;
  }
}
