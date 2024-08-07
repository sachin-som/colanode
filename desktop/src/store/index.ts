import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';
import { makeAutoObservable } from 'mobx';

export class AppStore {
  loaded: boolean;
  accounts: Account[];
  workspaces: Workspace[];

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
    this.workspaces = workspaces;
  }

  addWorkspace(workspace: Workspace) {
    this.workspaces.push(workspace);
  }
}

export const store = new AppStore();
