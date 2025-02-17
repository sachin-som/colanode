import { OpenAIEmbeddings } from '@langchain/openai';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateNodeEmbedding } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNode } from '@/lib/nodes';
import { getNodeModel } from '@colanode/core';

export type EmbedNodeInput = {
  type: 'embed_node';
  nodeId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    embed_node: {
      input: EmbedNodeInput;
    };
  }
}

const extractNodeText = async (
  nodeId: string,
  node: Awaited<ReturnType<typeof fetchNode>>
): Promise<string> => {
  if (!node) return '';

  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel) return '';

  const attributesText = nodeModel.getAttributesText(nodeId, node.attributes);
  if (attributesText) {
    return attributesText;
  }

  return '';
};

export const embedNodeHandler = async (input: {
  type: 'embed_node';
  nodeId: string;
}) => {
  if (!configuration.ai.enabled) {
    return;
  }

  const { nodeId } = input;
  const node = await fetchNode(nodeId);
  if (!node) {
    return;
  }

  // Skip nodes that are handled by document embeddings
  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel || nodeModel.documentSchema) {
    return;
  }

  const text = await extractNodeText(nodeId, node);
  if (!text || text.trim() === '') {
    await database
      .deleteFrom('node_embeddings')
      .where('node_id', '=', nodeId)
      .execute();
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(text, {
    type: 'node',
    node,
  });
  const embeddings = new OpenAIEmbeddings({
    apiKey: configuration.ai.embedding.apiKey,
    modelName: configuration.ai.embedding.modelName,
    dimensions: configuration.ai.embedding.dimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('node_embeddings')
    .select(['chunk', 'text'])
    .where('node_id', '=', nodeId)
    .execute();

  const embeddingsToCreateOrUpdate: CreateNodeEmbedding[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === chunk) continue;
    embeddingsToCreateOrUpdate.push({
      node_id: nodeId,
      chunk: i,
      parent_id: node.parent_id,
      root_id: node.root_id,
      workspace_id: node.workspace_id,
      text: chunk,
      embedding_vector: [],
      created_at: new Date(),
    });
  }

  const batchSize = configuration.ai.embedding.batchSize;
  for (let i = 0; i < embeddingsToCreateOrUpdate.length; i += batchSize) {
    const batch = embeddingsToCreateOrUpdate.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) => item.text);
    const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);
    for (let j = 0; j < batch.length; j++) {
      const vector = embeddingVectors[j];
      const batchItem = batch[j];
      if (batchItem) {
        batchItem.embedding_vector = vector ?? [];
      }
    }
  }

  if (embeddingsToCreateOrUpdate.length === 0) {
    return;
  }

  for (const embedding of embeddingsToCreateOrUpdate) {
    await database
      .insertInto('node_embeddings')
      .values({
        node_id: embedding.node_id,
        chunk: embedding.chunk,
        parent_id: embedding.parent_id,
        root_id: embedding.root_id,
        workspace_id: embedding.workspace_id,
        text: embedding.text,
        embedding_vector: sql.raw(
          `'[${embedding.embedding_vector.join(',')}]'::vector`
        ),
        created_at: embedding.created_at,
      })
      .onConflict((oc) =>
        oc.columns(['node_id', 'chunk']).doUpdateSet({
          text: sql.ref('excluded.text'),
          embedding_vector: sql.ref('excluded.embedding_vector'),
          updated_at: new Date(),
        })
      )
      .execute();
  }
};
