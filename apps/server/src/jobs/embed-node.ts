import { OpenAIEmbeddings } from '@langchain/openai';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateNodeEmbedding, SelectNode } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNode } from '@/lib/nodes';
import { getNodeModel } from '@colanode/core';
import { FieldValue, DatabaseAttributes } from '@colanode/core';

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
  node: SelectNode
): Promise<string | null | undefined> => {
  if (!node) {
    return;
  }

  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel) {
    return;
  }

  const nodeText = nodeModel.extractNodeText(node.id, node.attributes);
  if (!nodeText) {
    return;
  }

  if (node.attributes.type === 'record') {
    const fields = node.attributes.fields;
    if (!fields) {
      return;
    }

    const databaseNode = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.attributes.databaseId)
      .executeTakeFirst();

    if (!databaseNode) {
      return;
    }

    const databaseAttrs = databaseNode.attributes as DatabaseAttributes;
    const fieldTexts = Object.entries(fields)
      .map(([fieldId, field]) => {
        const typedField = field as FieldValue;
        const fieldInfo = databaseAttrs.fields[fieldId];
        if (!fieldInfo) {
          return null;
        }

        let valueText = '';
        switch (typedField.type) {
          case 'string':
          case 'text':
            valueText = typedField.value.toString();
            break;
          case 'number':
            valueText = typedField.value.toString();
            break;
          case 'boolean':
            valueText = typedField.value ? 'Yes' : 'No';
            break;
          case 'string_array':
            valueText = typedField.value.join(', ');
            break;
          default:
            break;
        }
        return `${fieldInfo.name}: ${valueText}`;
      })
      .filter(Boolean);

    return `Name: ${nodeText.name || 'Untitled Record'}\n${fieldTexts.join('\n')}`;
  }

  return nodeText.attributes;
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

  const nodeModel = getNodeModel(node.attributes.type);
  // Skip page nodes since they store content in documents
  if (!nodeModel || node.attributes.type === 'page') {
    return;
  }

  const text = await extractNodeText(node);
  if (!text || text.trim() === '') {
    await database
      .deleteFrom('node_embeddings')
      .where('node_id', '=', nodeId)
      .execute();
    return;
  }

  const chunkingService = new ChunkingService();
  const textChunks = await chunkingService.chunkText(text, {
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
  for (let i = 0; i < textChunks.length; i++) {
    const textChunk = textChunks[i];
    if (!textChunk) {
      continue;
    }

    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === textChunk) {
      continue;
    }

    embeddingsToCreateOrUpdate.push({
      node_id: nodeId,
      chunk: i,
      parent_id: node.parent_id,
      root_id: node.root_id,
      workspace_id: node.workspace_id,
      text: textChunk,
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
