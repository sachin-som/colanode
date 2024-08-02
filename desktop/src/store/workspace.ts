import {Node} from "@/types/nodes";
import {makeAutoObservable} from "mobx";
import {Workspace, WorkspaceRole} from "@/types/workspaces";

export class WorkspaceStore {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  versionId: string;
  accountId: string;
  role: WorkspaceRole;
  userNodeId: string;
  nodes: Record<string, Node>;

  constructor(workspace: Workspace) {
    this.id = workspace.id;
    this.name = workspace.name;
    this.description = workspace.description;
    this.avatar = workspace.avatar;
    this.versionId = workspace.versionId;
    this.accountId = workspace.accountId;
    this.role = workspace.role;
    this.userNodeId = workspace.userNodeId;
    this.nodes = {};

    makeAutoObservable(this);
  }

  getNode(nodeId: string) {
    return this.nodes[nodeId];
  }

  getNodes() {
    return Object.values(this.nodes);
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

  deleteNode(nodeId: string) {
    delete this.nodes[nodeId];
  }
}