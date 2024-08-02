import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { makeAutoObservable } from 'mobx';
import { WorkspaceStore } from '@/store/workspace';

export class AppStore {
  loaded: boolean;
  accounts: Account[];
  workspaces: WorkspaceStore[];

  constructor() {
    this.loaded = false;
    this.accounts = [];
    this.workspaces = [];

    makeAutoObservable(this);
  }

  setLoaded() {
    this.loaded = true;
  }

  setAccounts(accounts: Account[]) {
    this.accounts = accounts;
  }

  addAccount(account: Account) {
    this.accounts.push(account);
  }

  getWorkspace(id: string) {
    return this.workspaces.find((workspace) => workspace.id === id);
  }

  setWorkspaces(workspaces: Workspace[]) {
    this.workspaces = workspaces.map(
      (workspace) => new WorkspaceStore(workspace),
    );
  }

  addWorkspace(workspace: Workspace) {
    this.workspaces.push(new WorkspaceStore(workspace));
  }
}

export const store = new AppStore();
