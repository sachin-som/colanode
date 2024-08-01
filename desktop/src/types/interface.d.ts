import {Workspace} from "@/types/workspaces";
import {Transaction} from "@/types/transactions";
import {Account} from "@/types/accounts";
import {Node} from "@/types/nodes";

export interface GlobalDbApi {
  getAccounts: () => Promise<Account[]>
  addAccount: (account: Account) => Promise<void>
  getWorkspaces: () => Promise<Workspace[]>
  addWorkspace: (workspace: Workspace) => Promise<void>
  getNodes(): Promise<Node[]>
  enqueueTransaction: (transaction: Transaction) => Promise<void>
}

declare global {
  interface Window {
    globalDb: GlobalDbApi;
  }
}