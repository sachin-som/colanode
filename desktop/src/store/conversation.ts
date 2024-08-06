import { Node } from '@/types/nodes';
import { makeAutoObservable } from 'mobx';

export class ConversationStore {
  public nodes: Record<string, Node>;
  public isLoading: boolean;
  public hasMore: boolean;
  public isLoadingMore: boolean;

  constructor() {
    this.nodes = {};
    this.isLoading = false;
    this.hasMore = false;
    this.isLoadingMore = false;

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

  public setIsLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }

  public setHasMore(hasMore: boolean) {
    this.hasMore = hasMore;
  }

  public setIsLoadingMore(isLoadingMore: boolean) {
    this.isLoadingMore = isLoadingMore;
  }

  public getNode(nodeId: string) {
    return this.nodes[nodeId];
  }

  public getNodes() {
    return Object.values(this.nodes);
  }
}