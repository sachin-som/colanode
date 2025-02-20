import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { configuration } from '@/lib/configuration';
import { database } from '@/data/database';
import { addContextToChunk } from '@/services/llm-service';
import { getNodeModel, NodeType, FieldAttributes } from '@colanode/core';
import type { SelectNode, SelectDocument } from '@/data/schema';

type BaseMetadata = {
  id: string;
  name?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  author?: { id: string; name: string };
  lastAuthor?: { id: string; name: string };
  parentContext?: {
    id: string;
    type: string;
    name?: string;
    path?: string;
  };
  collaborators?: Array<{ id: string; name: string }>;
  workspace?: { id: string; name: string };
};

export type NodeMetadata = BaseMetadata & {
  type: 'node';
  nodeType: NodeType;
  fieldInfo?: Record<string, { type: string; name: string }>;
};

export type DocumentMetadata = BaseMetadata & {
  type: 'document';
};

export type ChunkingMetadata = NodeMetadata | DocumentMetadata;

export class ChunkingService {
  public async chunkText(
    text: string,
    metadata?: { type: 'node' | 'document'; node: SelectNode }
  ): Promise<string[]> {
    const chunkSize = configuration.ai.chunking.defaultChunkSize;
    const chunkOverlap = configuration.ai.chunking.defaultOverlap;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const docs = await splitter.createDocuments([text]);
    let chunks = docs.map((doc) => doc.pageContent);
    chunks = chunks.filter((c) => c.trim().length > 5); // We skip chunks that are 5 characters or less

    if (configuration.ai.chunking.enhanceWithContext) {
      const enrichedMetadata = await this.fetchMetadata(metadata);
      const enriched: string[] = [];
      for (const chunk of chunks) {
        const enrichedChunk = await addContextToChunk(
          chunk,
          text,
          enrichedMetadata
        );
        enriched.push(enrichedChunk);
      }

      return enriched;
    }

    return chunks;
  }

  private async fetchMetadata(metadata?: {
    type: 'node' | 'document';
    node: SelectNode;
  }): Promise<ChunkingMetadata | undefined> {
    if (!metadata) {
      return undefined;
    }

    if (metadata.type === 'node') {
      return this.buildNodeMetadata(metadata.node);
    } else {
      const document = await database
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', metadata.node.id)
        .executeTakeFirst();
      if (!document) {
        return undefined;
      }

      return this.buildDocumentMetadata(document, metadata.node);
    }
  }

  private async buildNodeMetadata(
    node: SelectNode
  ): Promise<NodeMetadata | undefined> {
    const nodeModel = getNodeModel(node.attributes.type);
    if (!nodeModel) {
      return undefined;
    }

    const baseMetadata = await this.buildBaseMetadata(node);
    if (!baseMetadata) {
      return undefined;
    }

    // Add collaborators if the node type supports them
    if ('collaborators' in node.attributes) {
      baseMetadata.collaborators = await this.fetchCollaborators(
        Object.keys(node.attributes.collaborators)
      );
    }

    // Add parent context if the node has a parent
    if (node.parent_id) {
      const parentContext = await this.buildParentContext(node);
      if (parentContext) {
        baseMetadata.parentContext = parentContext;
      }
    }

    // For record nodes, fetch the database schema to provide field context
    let fieldInfo: Record<string, { type: string; name: string }> | undefined;
    if (node.attributes.type === 'record') {
      const databaseNode = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', node.attributes.databaseId)
        .executeTakeFirst();

      if (databaseNode?.attributes.type === 'database') {
        fieldInfo = Object.entries(databaseNode.attributes.fields).reduce(
          (acc, [fieldId, field]) => ({
            ...acc,
            [fieldId]: {
              type: (field as FieldAttributes).type,
              name: (field as FieldAttributes).name,
            },
          }),
          {} as Record<string, { type: string; name: string }>
        );
      }
    }

    return {
      type: 'node',
      nodeType: node.attributes.type,
      fieldInfo,
      ...baseMetadata,
    };
  }

  private async buildDocumentMetadata(
    document: SelectDocument,
    node?: SelectNode
  ): Promise<DocumentMetadata | undefined> {
    let baseMetadata: BaseMetadata = {
      id: document.id,
      createdAt: document.created_at,
      createdBy: document.created_by,
    };

    if (!node) {
      return undefined;
    }

    const nodeModel = getNodeModel(node.attributes.type);
    if (nodeModel) {
      const nodeText = nodeModel.extractNodeText(node.id, node.attributes);
      if (nodeText) {
        baseMetadata.name = nodeText.name;
      }

      // Add parent context if available
      if (node.parent_id) {
        const parentContext = await this.buildParentContext(node);
        if (parentContext) {
          baseMetadata.parentContext = parentContext;
        }
      }
    }

    return {
      type: 'document',
      ...baseMetadata,
    };
  }

  private async buildBaseMetadata(
    node: SelectNode
  ): Promise<BaseMetadata | undefined> {
    const nodeModel = getNodeModel(node.attributes.type);
    if (!nodeModel) {
      return undefined;
    }

    const nodeText = nodeModel.extractNodeText(node.id, node.attributes);
    if (!nodeText) {
      return undefined;
    }

    const author = await database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', '=', node.created_by)
      .executeTakeFirst();

    const lastAuthor = node.updated_by
      ? await database
          .selectFrom('users')
          .select(['id', 'name'])
          .where('id', '=', node.updated_by)
          .executeTakeFirst()
      : undefined;

    const workspace = await database
      .selectFrom('workspaces')
      .select(['id', 'name'])
      .where('id', '=', node.workspace_id)
      .executeTakeFirst();

    return {
      id: node.id,
      name: nodeText.name ?? node.attributes.type,
      createdAt: node.created_at,
      createdBy: node.created_by,
      updatedAt: node.updated_at,
      updatedBy: node.updated_by,
      author: author,
      lastAuthor: lastAuthor,
      workspace: workspace,
    };
  }

  private async buildParentContext(
    node: SelectNode
  ): Promise<BaseMetadata['parentContext'] | undefined> {
    const parentNode = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.parent_id)
      .executeTakeFirst();

    if (!parentNode) {
      return undefined;
    }

    const parentModel = getNodeModel(parentNode.attributes.type);
    if (!parentModel) {
      return undefined;
    }

    const parentText = parentModel.extractNodeText(
      parentNode.id,
      parentNode.attributes
    );

    // Get the full path by traversing up the tree, ordered from root to leaf
    const pathNodes = await database
      .selectFrom('node_paths')
      .innerJoin('nodes', 'nodes.id', 'node_paths.ancestor_id')
      .select(['nodes.id', 'nodes.attributes'])
      .where('node_paths.descendant_id', '=', node.id)
      .orderBy('node_paths.level', 'desc')
      .execute();

    const path = pathNodes
      .map((n) => {
        const model = getNodeModel(n.attributes.type);
        return model?.extractNodeText(n.id, n.attributes)?.name ?? '';
      })
      .join(' / ');

    return {
      id: parentNode.id,
      type: parentNode.attributes.type,
      name: parentText?.name ?? undefined,
      path,
    };
  }

  private async fetchCollaborators(
    collaboratorIds: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    if (!collaboratorIds.length) {
      return [];
    }

    const collaborators = await database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', 'in', collaboratorIds)
      .execute();

    return collaborators.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }
}
