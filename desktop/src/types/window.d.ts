import {Workspace} from "@/types/workspaces";
import {Transaction} from "@/types/transactions";
import {Account} from "@/types/accounts";
import {Node} from "@/types/nodes";
import {GlobalDatabaseData} from "@/types/global";

export interface GlobalDbApi {
  init: () => Promise<GlobalDatabaseData>
  getAccounts: () => Promise<Account[]>
  addAccount: (account: Account) => Promise<void>
  getWorkspaces: () => Promise<Workspace[]>
  addWorkspace: (workspace: Workspace) => Promise<void>
  addTransaction: (transaction: Transaction) => Promise<void>
}

export interface WorkspaceDbApi {
  addNode: (accountId: string, workspaceId: string, node: Node) => Promise<void>
  getNodes: (accountId: string, workspaceId: string) => Promise<Node[]>
  updateNode: (accountId: string, workspaceId: string, node: Node) => Promise<void>
  deleteNode: (accountId: string, workspaceId: string, nodeId: string) => Promise<void>
}

declare global {
  interface Window {
    globalDb: GlobalDbApi;
    workspaceDb: WorkspaceDbApi;
  }
}