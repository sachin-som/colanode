import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { configuration } from '@/lib/configuration';
import { database } from '@/data/database';
import { addContextToChunk } from '@/services/llm-service';
import {
  DocumentContent,
  getNodeModel,
  Node,
  NodeAttributes,
} from '@colanode/core';
import type { SelectNode, SelectDocument, SelectUser } from '@/data/schema';

type BaseMetadata = {
  id: string;
  name?: string;
  createdAt: Date;
  createdBy: string;
  author?: { id: string; name: string };
  parentContext?: {
    id: string;
    type: string;
    name?: string;
    path?: string;
  };
  collaborators?: Array<{ id: string; name: string; role: string }>;
  lastUpdated?: Date;
  updatedBy?: { id: string; name: string };
  workspace?: { id: string; name: string };
};

export type NodeMetadata = BaseMetadata & {
  type: 'node';
  nodeType: string;
  fields?: Record<string, unknown> | null;
};

export type DocumentMetadata = BaseMetadata & {
  type: 'document';
  content: DocumentContent;
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
    chunks = chunks.filter((c) => c.trim().length > 10);

    if (configuration.ai.chunking.enhanceWithContext) {
      const enrichedMetadata = await this.fetchMetadata(metadata);
      const enriched: string[] = [];
      for (const chunk of chunks) {
        const c = await addContextToChunk(chunk, text, enrichedMetadata);
        enriched.push(c);
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
      const document = (await database
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', metadata.node.id)
        .executeTakeFirst()) as SelectDocument | undefined;
      if (!document) {
        return undefined;
      }

      return this.buildDocumentMetadata(document, metadata.node);
    }
  }

  private async buildNodeMetadata(node: SelectNode): Promise<NodeMetadata> {
    const nodeModel = getNodeModel(node.attributes.type);
    if (!nodeModel) {
      throw new Error(`No model found for node type: ${node.attributes.type}`);
    }

    const baseMetadata = await this.buildBaseMetadata(node);

    // Add collaborators if the node type supports them
    if ('collaborators' in node.attributes) {
      baseMetadata.collaborators = await this.fetchCollaborators(
        Object.keys(
          (
            node.attributes as NodeAttributes & {
              collaborators: Record<string, string>;
            }
          ).collaborators
        )
      );
    }

    // Add parent context if needed
    if (node.parent_id) {
      const parentContext = await this.buildParentContext(node);
      if (parentContext) {
        baseMetadata.parentContext = parentContext;
      }
    }

    return {
      type: 'node',
      nodeType: node.attributes.type,
      fields: 'fields' in node.attributes ? node.attributes.fields : null,
      ...baseMetadata,
    };
  }

  private async buildDocumentMetadata(
    document: SelectDocument,
    node?: SelectNode
  ): Promise<DocumentMetadata> {
    let baseMetadata: BaseMetadata = {
      id: document.id,
      createdAt: document.created_at,
      createdBy: document.created_by,
    };

    if (node) {
      const nodeModel = getNodeModel(node.attributes.type);
      if (nodeModel) {
        const nodeName = nodeModel.getName(node.id, node.attributes);
        if (nodeName) {
          baseMetadata.name = nodeName;
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
        content: document.content,
        ...baseMetadata,
      };
    }

    return {
      type: 'document',
      content: document.content,
      ...baseMetadata,
    };
  }

  private async buildBaseMetadata(node: SelectNode): Promise<BaseMetadata> {
    const nodeModel = getNodeModel(node.attributes.type);
    const nodeName = nodeModel?.getName(node.id, node.attributes);

    const author = await database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', '=', node.created_by)
      .executeTakeFirst();

    const updatedBy = node.updated_by
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
      name: nodeName ?? '',
      createdAt: node.created_at,
      createdBy: node.created_by,
      author: author ?? undefined,
      lastUpdated: node.updated_at ?? undefined,
      updatedBy: updatedBy ?? undefined,
      workspace: workspace ?? undefined,
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

    const parentName = parentModel.getName(
      parentNode.id,
      parentNode.attributes
    );

    // Get the full path by traversing up the tree
    const pathNodes = await database
      .selectFrom('node_paths')
      .innerJoin('nodes', 'nodes.id', 'node_paths.ancestor_id')
      .select(['nodes.id', 'nodes.attributes'])
      .where('node_paths.descendant_id', '=', node.id)
      .orderBy('node_paths.level', 'asc')
      .execute();

    const path = pathNodes
      .map((n) => {
        const model = getNodeModel(n.attributes.type);
        return model?.getName(n.id, n.attributes) ?? 'Untitled';
      })
      .join(' / ');

    return {
      id: parentNode.id,
      type: parentNode.attributes.type,
      name: parentName ?? undefined,
      path,
    };
  }

  private async fetchCollaborators(
    collaboratorIds: string[]
  ): Promise<Array<{ id: string; name: string; role: string }>> {
    if (!collaboratorIds.length) {
      return [];
    }

    const collaborators = await database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', 'in', collaboratorIds)
      .execute();

    // Get roles for each collaborator
    return Promise.all(
      collaborators.map(async (c) => {
        const collaboration = await database
          .selectFrom('collaborations')
          .select(['role'])
          .where('collaborator_id', '=', c.id)
          .executeTakeFirst();

        return {
          id: c.id,
          name: c.name,
          role: collaboration?.role ?? 'unknown',
        };
      })
    );
  }
}
