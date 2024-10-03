import {
  CreateNode,
  SelectNode,
  WorkspaceDatabaseSchema,
} from '@/electron/schemas/workspace';
import {
  LocalNode,
  LocalNodeWithChildren,
  NodeInsertInput,
} from '@/types/nodes';
import { generateKeyBetween } from 'fractional-indexing-jittered';
import { NodeTypes } from '@/lib/constants';
import { CompiledQuery, Kysely } from 'kysely';
import * as Y from 'yjs';
import { NeuronId } from '@/lib/id';
import { fromUint8Array } from 'js-base64';

export const buildNodeWithChildren = (
  node: LocalNode,
  allNodes: LocalNode[],
): LocalNodeWithChildren => {
  const children: LocalNodeWithChildren[] = allNodes
    .filter((n) => n.parentId === node.id)
    .map((n) => buildNodeWithChildren(n, allNodes));

  return {
    ...node,
    children: children,
  };
};

export const generateNodeIndex = (
  previous?: string | null,
  next?: string | null,
) => {
  const lower = previous === undefined ? null : previous;
  const upper = next === undefined ? null : next;

  return generateKeyBetween(lower, upper);
};

export const buildNodeInsertMutation = (
  schema: Kysely<WorkspaceDatabaseSchema>,
  userId: string,
  input: NodeInsertInput | NodeInsertInput[],
): CompiledQuery => {
  const nodes = Array.isArray(input)
    ? input.map((node) => buildCreateNode(node, userId))
    : buildCreateNode(input, userId);

  return schema.insertInto('nodes').values(nodes).compile();
};

export const buildCreateNode = (
  input: NodeInsertInput,
  userId: string,
): CreateNode => {
  const doc = new Y.Doc({
    guid: input.id,
  });

  const attributesMap = doc.getMap('attributes');

  doc.transact(() => {
    for (const [key, value] of Object.entries(input.attributes)) {
      if (value !== undefined) {
        attributesMap.set(key, value);
      }
    }
  });

  const attributes = JSON.stringify(attributesMap.toJSON());
  const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

  return {
    id: input.id,
    attributes: attributes,
    state: encodedState,
    created_at: new Date().toISOString(),
    created_by: userId,
    version_id: NeuronId.generate(NeuronId.Type.Version),
  };
};

export const mapNode = (row: SelectNode): LocalNode => {
  return {
    id: row.id,
    type: row.type,
    index: row.index,
    parentId: row.parent_id,
    attributes: JSON.parse(row.attributes),
    state: row.state,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    versionId: row.version_id,
    serverCreatedAt: row.server_created_at,
    serverUpdatedAt: row.server_updated_at,
    serverVersionId: row.server_version_id,
  };
};

export const getDefaultNodeIcon = (type: string) => {
  switch (type) {
    case NodeTypes.Channel:
      return 'discuss-line';
    case NodeTypes.Page:
      return 'book-line';
    case NodeTypes.Database:
      return 'database-2-line';
    case NodeTypes.Record:
      return 'article-line';
    case NodeTypes.Folder:
      return 'folder-open-line';
    case NodeTypes.Space:
      return 'team-line';
    default:
      return 'file-unknown-line';
  }
};
