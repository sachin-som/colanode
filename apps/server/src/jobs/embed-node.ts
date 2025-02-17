import { OpenAIEmbeddings } from '@langchain/openai';
import { extractBlockTexts, NodeAttributes, FieldValue } from '@colanode/core';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateNodeEmbedding } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNode } from '@/lib/nodes';
import { JobHandler } from '@/types/jobs';

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

const formatFieldValue = (fieldValue: FieldValue): string => {
  switch (fieldValue.type) {
    case 'boolean':
      return `${fieldValue.value ? 'Yes' : 'No'}`;
    case 'string_array':
      return (fieldValue.value as string[]).join(', ');
    case 'number':
    case 'string':
    case 'text':
      return String(fieldValue.value);
    default:
      return '';
  }
};

const extractNodeText = async (
  nodeId: string,
  attributes: NodeAttributes
): Promise<string> => {
  switch (attributes.type) {
    case 'message':
      return extractBlockTexts(nodeId, attributes.content) ?? '';
    case 'record': {
      const sections: string[] = [];

      // Fetch the database node to get its name
      const databaseNode = await fetchNode(attributes.databaseId);
      const databaseName =
        databaseNode?.attributes.type === 'database'
          ? databaseNode.attributes.name
          : attributes.databaseId;

      // Add field context with database name
      sections.push(`Field "${attributes.name}" in database "${databaseName}"`);

      // Process field value
      Object.entries(attributes.fields).forEach(([fieldName, fieldValue]) => {
        if (!fieldValue || !('type' in fieldValue)) {
          return;
        }

        const value = formatFieldValue(fieldValue as FieldValue);
        if (value) {
          sections.push(value);
        }
      });

      return sections.join('\n');
    }
    default:
      return '';
  }
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

  // Skip page nodes (document content is handled separately in the embed document job)
  if (node.type === 'page') {
    return;
  }

  const text = await extractNodeText(node.id, node.attributes);
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
    id: nodeId,
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
