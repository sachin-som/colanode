import { Node, NodeBlock } from '@/types/nodes';

export type LocalMutation =
  | LocalCreateNodeMutation
  | LocalCreateNodesMutation
  | LocalUpdateNodeMutation
  | LocalDeleteNodeMutation
  | LocalDeleteNodesMutation;

export type LocalCreateNodeMutation = {
  type: 'create_node';
  data: {
    node: LocalCreateNodeData;
  };
};

export type LocalCreateNodesMutation = {
  type: 'create_nodes';
  data: {
    nodes: LocalCreateNodeData[];
  };
};

export type LocalCreateNodeData = {
  id: string;
  type: string;
  parentId: string | null;
  workspaceId: string;
  index: string | null;
  content: NodeBlock[];
  attrs: Record<string, any>;
  createdAt: string;
  createdBy: string;
  versionId: string;
};

export type LocalUpdateNodeMutation = {
  type: 'update_node';
  data: {
    id: string;
    type: string;
    parentId: string | null;
    index: string | null;
    content: NodeBlock[];
    attrs: Record<string, any>;
    updatedAt: string;
    updatedBy: string;
    versionId: string;
  };
};

export type LocalDeleteNodeMutation = {
  type: 'delete_node';
  data: {
    id: string;
  };
};

export type LocalDeleteNodesMutation = {
  type: 'delete_nodes';
  data: {
    ids: string[];
  };
};

export type ServerMutation =
  | ServerCreateNodeMutation
  | ServerCreateNodesMutation
  | ServerUpdateNodeMutation
  | ServerDeleteNodeMutation
  | ServerDeleteNodesMutation;

export type ServerCreateNodeMutation = {
  id: string;
  type: 'create_node';
  workspaceId: string;
  data: {
    node: Node;
  };
  createdAt: string;
};

export type ServerCreateNodesMutation = {
  id: string;
  type: 'create_nodes';
  workspaceId: string;
  data: {
    nodes: Node[];
  };
  createdAt: string;
};

export type ServerUpdateNodeMutation = {
  id: string;
  type: 'update_node';
  workspaceId: string;
  data: {
    node: Node;
  };
  createdAt: string;
};

export type ServerDeleteNodeMutation = {
  id: string;
  type: 'delete_node';
  workspaceId: string;
  data: {
    id: string;
  };
  createdAt: string;
};

export type ServerDeleteNodesMutation = {
  id: string;
  type: 'delete_nodes';
  workspaceId: string;
  data: {
    ids: string[];
  };
  createdAt: string;
};
