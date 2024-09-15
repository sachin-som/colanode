import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface NodeTable {
  id: ColumnType<string, string, never>;
  parent_id: ColumnType<string, string, string>;
  type: ColumnType<string, string, string>;
  index: ColumnType<string | null, string | null, string | null>;
  content: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  server_version_id: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;
export type SelectNodeWithAttributes = SelectNode & {
  attributes: string;
};

interface NodeAttributeTable {
  node_id: ColumnType<string, string, never>;
  type: ColumnType<string, string, never>;
  key: ColumnType<string, string, never>;
  text_value: ColumnType<string | null, string | null, string | null>;
  number_value: ColumnType<number | null, number | null, number | null>;
  foreign_node_id: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  server_version_id: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeAttribute = Selectable<NodeAttributeTable>;
export type CreateNodeAttribute = Insertable<NodeAttributeTable>;
export type UpdateNodeAttribute = Updateable<NodeAttributeTable>;

interface NodeReactionTable {
  node_id: ColumnType<string, string, never>;
  reactor_id: ColumnType<string, string, never>;
  reaction: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeReaction = Selectable<NodeReactionTable>;
export type CreateNodeReaction = Insertable<NodeReactionTable>;
export type UpdateNodeReaction = Updateable<NodeReactionTable>;

interface MutationTable {
  id: ColumnType<number, never, never>;
  table: ColumnType<string, string, never>;
  action: ColumnType<string, string, never>;
  before: ColumnType<string | null, string | null, never>;
  after: ColumnType<string | null, string | null, never>;
  created_at: ColumnType<string, string, never>;
}

export type SelectMutation = Selectable<MutationTable>;
export type CreateMutation = Insertable<MutationTable>;
export type UpdateMutation = Updateable<MutationTable>;

export interface WorkspaceDatabaseSchema {
  nodes: NodeTable;
  node_attributes: NodeAttributeTable;
  mutations: MutationTable;
  node_reactions: NodeReactionTable;
}
