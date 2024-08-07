import { Node } from '@/types/nodes';
import { makeAutoObservable } from 'mobx';

export class ContainerStore {
  public nodes: Record<string, Node>;
  public isLoading: boolean;

  constructor() {
    this.nodes = {};
    this.isLoading = false;

    makeAutoObservable(this);
  }

  public setNode(node: Node) {
    this.nodes[node.id] = node;
  }

  public setNodes(nodes: Node[]) {
    nodes.forEach((node) => {
      this.nodes[node.id] = node;
    });
  }

  public deleteNode(nodeId: string) {
    delete this.nodes[nodeId];
  }

  public setIsLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }

  public getNode(nodeId: string) {
    return this.nodes[nodeId];
  }

  public getNodes() {
    return Object.values(this.nodes);
  }
}