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
  type: string;
  name?: string;
  createdAt: Date;
  createdBy: string;
  author?: { id: string; name: string };
  parentContext?: {
    id: string;
    type: string;
    name?: string;
  };
  collaborators?: Array<{ id: string; name: string }>;
};

export type NodeMetadata = {
  type: 'node';
  metadata: BaseMetadata & {
    fields?: Record<string, unknown> | null;
  };
};

export type DocumentMetadata = {
  type: 'document';
  metadata: BaseMetadata & {
    content: DocumentContent;
  };
};

export type ChunkingMetadata = NodeMetadata | DocumentMetadata;

export class ChunkingService {
  public async chunkText(
    text: string,
    metadata?: { type: 'node' | 'document'; id: string }
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
    id: string;
  }): Promise<ChunkingMetadata | undefined> {
    if (!metadata) {
      return undefined;
    }

    if (metadata.type === 'node') {
      const node = (await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', metadata.id)
        .executeTakeFirst()) as SelectNode | undefined;
      if (!node) {
        return undefined;
      }

      return this.buildNodeMetadata(node);
    } else {
      const document = (await database
        .selectFrom('documents')
        .selectAll()
        .where('id', '=', metadata.id)
        .executeTakeFirst()) as SelectDocument | undefined;
      if (!document) {
        return undefined;
      }

      const node = (await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', document.id)
        .executeTakeFirst()) as SelectNode | undefined;

      return this.buildDocumentMetadata(document, node);
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
      metadata: {
        ...baseMetadata,
        fields: 'fields' in node.attributes ? node.attributes.fields : null,
      },
    };
  }

  private async buildDocumentMetadata(
    document: SelectDocument,
    node?: SelectNode
  ): Promise<DocumentMetadata> {
    let baseMetadata: BaseMetadata = {
      id: document.id,
      type: 'document',
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
    }

    return {
      type: 'document',
      metadata: {
        ...baseMetadata,
        content: document.content,
      },
    };
  }

  private async buildBaseMetadata(node: SelectNode): Promise<BaseMetadata> {
    const nodeModel = getNodeModel(node.attributes.type);
    const nodeName = nodeModel?.getName(node.id, node.attributes);

    const author = (await database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', '=', node.created_by)
      .executeTakeFirst()) as SelectUser | undefined;

    return {
      id: node.id,
      type: node.attributes.type,
      name: nodeName ?? undefined,
      createdAt: node.created_at,
      createdBy: node.created_by,
      author: author ?? undefined,
    };
  }

  private async buildParentContext(
    node: SelectNode
  ): Promise<BaseMetadata['parentContext'] | undefined> {
    const parentNode = (await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.parent_id)
      .executeTakeFirst()) as SelectNode | undefined;

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

    return {
      id: parentNode.id,
      type: parentNode.attributes.type,
      name: parentName ?? undefined,
    };
  }

  private async fetchCollaborators(
    collaboratorIds: string[]
  ): Promise<Array<{ id: string; name: string }>> {
    if (!collaboratorIds.length) {
      return [];
    }

    return database
      .selectFrom('users')
      .select(['id', 'name'])
      .where('id', 'in', collaboratorIds)
      .execute() as Promise<Array<{ id: string; name: string }>>;
  }
}
