import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { sql } from 'kysely';

type SearchResult = {
  id: string;
  text: string;
  score: number;
  type: 'semantic' | 'keyword';
  createdAt?: Date;
  chunkIndex: number;
};

export class NodeRetrievalService {
  private embeddings = new OpenAIEmbeddings({
    apiKey: configuration.ai.embedding.apiKey,
    modelName: configuration.ai.embedding.modelName,
    dimensions: configuration.ai.embedding.dimensions,
  });

  public async retrieve(
    query: string,
    workspaceId: string,
    userId: string,
    limit = configuration.ai.retrieval.hybridSearch.maxResults
  ): Promise<Document[]> {
    const embedding = await this.embeddings.embedQuery(query);
    if (!embedding) return [];
    const semanticResults = await this.semanticSearch(
      embedding,
      workspaceId,
      userId,
      limit
    );
    const keywordResults = await this.keywordSearch(
      query,
      workspaceId,
      userId,
      limit
    );
    return this.combineSearchResults(semanticResults, keywordResults);
  }

  private async semanticSearch(
    embedding: number[],
    workspaceId: string,
    userId: string,
    limit: number
  ): Promise<SearchResult[]> {
    const results = await database
      .selectFrom('node_embeddings')
      .innerJoin('nodes', 'nodes.id', 'node_embeddings.node_id')
      .select((eb) => [
        'node_embeddings.node_id as id',
        'node_embeddings.text',
        'nodes.created_at',
        'node_embeddings.chunk as chunk_index',
        // Wrap raw expression to satisfy type:
        sql<number>`('[${embedding.join(',')}]'::vector) <=> node_embeddings.embedding_vector`.as(
          'similarity'
        ),
      ])
      .where('node_embeddings.workspace_id', '=', workspaceId)
      .groupBy([
        'node_embeddings.node_id',
        'node_embeddings.text',
        'nodes.created_at',
        'node_embeddings.chunk',
      ])
      .orderBy('similarity', 'asc')
      .limit(limit)
      .execute();

    return results.map((result) => ({
      id: result.id,
      text: result.text,
      score: result.similarity,
      type: 'semantic',
      createdAt: result.created_at,
      chunkIndex: result.chunk_index,
    }));
  }

  private async keywordSearch(
    query: string,
    workspaceId: string,
    userId: string,
    limit: number
  ): Promise<SearchResult[]> {
    const results = await database
      .selectFrom('node_embeddings')
      .innerJoin('nodes', 'nodes.id', 'node_embeddings.node_id')
      .select((eb) => [
        'node_embeddings.node_id as id',
        'node_embeddings.text',
        'nodes.created_at',
        'node_embeddings.chunk as chunk_index',
        sql<number>`ts_rank(node_embeddings.search_vector, websearch_to_tsquery('english', ${query}))`.as(
          'rank'
        ),
      ])
      .where('node_embeddings.workspace_id', '=', workspaceId)
      .where(
        (eb) =>
          sql`node_embeddings.search_vector @@ websearch_to_tsquery('english', ${query})`
      )
      .groupBy([
        'node_embeddings.node_id',
        'node_embeddings.text',
        'nodes.created_at',
        'node_embeddings.chunk',
      ])
      .orderBy('rank', 'desc')
      .limit(limit)
      .execute();

    return results.map((result) => ({
      id: result.id,
      text: result.text,
      score: result.rank,
      type: 'keyword',
      createdAt: result.created_at,
      chunkIndex: result.chunk_index,
    }));
  }

  private combineSearchResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[]
  ): Document[] {
    const { semanticSearchWeight, keywordSearchWeight } =
      configuration.ai.retrieval.hybridSearch;
    const maxSemanticScore = Math.max(
      ...semanticResults.map((r) => r.score),
      1
    );
    const maxKeywordScore = Math.max(...keywordResults.map((r) => r.score), 1);
    const combined = new Map<string, SearchResult & { finalScore: number }>();
    const createKey = (result: SearchResult) =>
      `${result.id}-${result.chunkIndex}`;
    const calculateRecencyBoost = (
      createdAt: Date | undefined | null
    ): number => {
      if (!createdAt) return 1;
      const now = new Date();
      const ageInDays =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays <= 7 ? 1 + (1 - ageInDays / 7) * 0.2 : 1;
    };

    semanticResults.forEach((result) => {
      const key = createKey(result);
      const recencyBoost = calculateRecencyBoost(result.createdAt);
      const normalizedScore =
        ((maxSemanticScore - result.score) / maxSemanticScore) *
        semanticSearchWeight;
      combined.set(key, {
        ...result,
        finalScore: normalizedScore * recencyBoost,
      });
    });

    keywordResults.forEach((result) => {
      const key = createKey(result);
      const recencyBoost = calculateRecencyBoost(result.createdAt);
      const normalizedScore =
        (result.score / maxKeywordScore) * keywordSearchWeight;
      if (combined.has(key)) {
        const existing = combined.get(key)!;
        existing.finalScore += normalizedScore * recencyBoost;
      } else {
        combined.set(key, {
          ...result,
          finalScore: normalizedScore * recencyBoost,
        });
      }
    });

    return Array.from(combined.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(
        (result) =>
          new Document({
            pageContent: result.text,
            metadata: {
              id: result.id,
              score: result.finalScore,
              createdAt: result.createdAt,
              type: 'node',
              chunkIndex: result.chunkIndex,
            },
          })
      );
  }
}

export const nodeRetrievalService = new NodeRetrievalService();
