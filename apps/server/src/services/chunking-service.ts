// Updated chunking-service.ts
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { configuration } from '@/lib/configuration';
import { database } from '@/data/database';
import { addContextToChunk } from '@/services/llm-service';

export type ChunkingMetadata = {
  nodeId: string;
  type: string;
  name?: string;
  parentName?: string;
  spaceName?: string;
  createdAt: Date;
};

export class ChunkingService {
  // Unified chunkText that optionally enriches the chunk with context metadata.
  public async chunkText(
    text: string,
    metadataInfo?: { type: 'node' | 'document'; id: string }
  ): Promise<string[]> {
    const chunkSize = configuration.ai.chunking.defaultChunkSize;
    const chunkOverlap = configuration.ai.chunking.defaultOverlap;
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    const docs = await splitter.createDocuments([text]);
    let chunks = docs
      .map((doc) => doc.pageContent)
      .filter((c) => c.trim().length > 10);
    if (configuration.ai.chunking.enhanceWithContext) {
      // Fetch unified metadata (using a single query if possible)
      const metadata = metadataInfo
        ? await this.fetchMetadata(metadataInfo)
        : undefined;
      chunks = await Promise.all(
        chunks.map(async (chunk) => {
          return addContextToChunk(chunk, text, metadata);
        })
      );
    }
    return chunks;
  }

  // A unified metadata fetch which uses a join to gather node and parent (space) details.
  private async fetchMetadata(info: {
    type: 'node' | 'document';
    id: string;
  }): Promise<ChunkingMetadata | undefined> {
    if (info.type === 'node') {
      // Fetch node along with parent (if exists) and the root (assumed to be the space)
      const result = await database
        .selectFrom('nodes')
        .leftJoin('nodes as parent', 'nodes.parent_id', 'parent.id')
        .leftJoin('nodes as root', 'nodes.root_id', 'root.id')
        .select([
          'nodes.id as nodeId',
          'nodes.type',
          "nodes.attributes->>'name' as name",
          "parent.attributes->>'name' as parentName",
          "root.attributes->>'name' as spaceName",
          'nodes.created_at as createdAt',
        ])
        .where('nodes.id', '=', info.id)
        .executeTakeFirst();
      if (!result) return undefined;
      return {
        nodeId: result.nodeId,
        type: result.type,
        name: result.name,
        parentName: result.parentName,
        spaceName: result.spaceName,
        createdAt: result.createdAt,
      };
    } else {
      // For documents, assume similar metadata based on associated node.
      const result = await database
        .selectFrom('documents')
        .innerJoin('nodes', 'documents.id', 'nodes.id')
        .select([
          'nodes.id as nodeId',
          'nodes.type',
          "nodes.attributes->>'name' as name",
          'nodes.created_at as createdAt',
        ])
        .where('documents.id', '=', info.id)
        .executeTakeFirst();
      if (!result) return undefined;
      return {
        nodeId: result.nodeId,
        type: result.type,
        name: result.name,
        createdAt: result.createdAt,
      };
    }
  }
}
