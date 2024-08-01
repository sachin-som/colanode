import {Account} from "@/types/accounts";
import {Workspace} from "@/types/workspaces";
import {Node} from "@/types/nodes";
import {makeAutoObservable} from "mobx";

export class AppStore {
  loaded: boolean;
  accounts: Account[];
  workspaces: Workspace[];
  nodes: Record<string, Node>;

  constructor() {
    this.loaded = false;
    this.accounts = [];
    this.workspaces = [];
    this.nodes = {};

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

  setWorkspaces(workspaces: Workspace[]) {
    this.workspaces = workspaces;
  }

  addWorkspace(workspace: Workspace) {
    this.workspaces.push(workspace);
  }

  setNodes(nodes: Node[]) {
    this.nodes = nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {} as Record<string, Node>);
  }

  setNode(node: Node) {
    this.nodes[node.id] = node;
  }

  removeNode(nodeId: string) {
    delete this.nodes[nodeId];
  }
}

export const store = new AppStore();