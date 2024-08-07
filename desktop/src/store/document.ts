import { Node } from '@/types/nodes';
import { makeAutoObservable } from 'mobx';

export class DocumentStore {
  public nodes: Record<string, Node>;
  public isLoaded: boolean;

  constructor() {
    this.nodes = {};
    this.isLoaded = false;

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

  public setIsLoaded(isLoaded: boolean) {
    this.isLoaded = isLoaded;
  }

  public getNode(nodeId: string) {
    return this.nodes[nodeId];
  }

  public getNodes() {
    return Object.values(this.nodes);
  }
}
