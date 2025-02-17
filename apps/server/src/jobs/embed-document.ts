import { OpenAIEmbeddings } from '@langchain/openai';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateDocumentEmbedding } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNode } from '@/lib/nodes';
import { DocumentContent, extractBlockTexts } from '@colanode/core';

export type EmbedDocumentInput = {
  type: 'embed_document';
  documentId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    embed_document: {
      input: EmbedDocumentInput;
    };
  }
}

const getNodeDisplayName = (
  node: Awaited<ReturnType<typeof fetchNode>>
): string => {
  if (!node) {
    return '';
  }

  switch (node.attributes.type) {
    case 'page':
    case 'database':
    case 'folder':
    case 'database_view':
      return node.attributes.name;
    case 'record':
      return node.attributes.name;
    default:
      return '';
  }
};

const extractDocumentText = async (
  documentId: string,
  content: DocumentContent
): Promise<string> => {
  const sections: string[] = [];

  if (documentId) {
    const node = await fetchNode(documentId);
    if (!node) return '';

    const nodeName = getNodeDisplayName(node);

    if (node.attributes.type === 'record') {
      const databaseNode = await fetchNode(node.attributes.databaseId);
      const databaseName =
        databaseNode?.attributes.type === 'database'
          ? databaseNode.attributes.name
          : node.attributes.databaseId;

      sections.push(`Record "${nodeName}" in database "${databaseName}"`);
    } else if (nodeName) {
      sections.push(`${node.attributes.type} "${nodeName}"`);
    }
  }

  const blocksText = extractBlockTexts(documentId, content.blocks);
  if (blocksText) {
    sections.push('Content:');
    sections.push(blocksText);
  }

  return sections.join('\n\n');
};

export const embedDocumentHandler = async (input: {
  type: 'embed_document';
  documentId: string;
}) => {
  if (!configuration.ai.enabled) {
    return;
  }

  const { documentId } = input;

  const document = await database
    .selectFrom('documents')
    .select(['id', 'content', 'workspace_id', 'created_at'])
    .where('id', '=', documentId)
    .executeTakeFirst();

  if (!document) {
    return;
  }

  const text = await extractDocumentText(documentId, document.content);
  if (!text || text.trim() === '') {
    await database
      .deleteFrom('document_embeddings')
      .where('document_id', '=', documentId)
      .execute();
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(text, {
    type: 'document',
    id: documentId,
  });
  const embeddings = new OpenAIEmbeddings({
    apiKey: configuration.ai.embedding.apiKey,
    modelName: configuration.ai.embedding.modelName,
    dimensions: configuration.ai.embedding.dimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('document_embeddings')
    .select(['chunk', 'text'])
    .where('document_id', '=', documentId)
    .execute();

  const embeddingsToCreateOrUpdate: CreateDocumentEmbedding[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === chunk) continue;
    embeddingsToCreateOrUpdate.push({
      document_id: documentId,
      chunk: i,
      workspace_id: document.workspace_id,
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
      .insertInto('document_embeddings')
      .values({
        document_id: embedding.document_id,
        chunk: embedding.chunk,
        workspace_id: embedding.workspace_id,
        text: embedding.text,
        embedding_vector: sql.raw(
          `'[${embedding.embedding_vector.join(',')}]'::vector`
        ),
        created_at: embedding.created_at,
      })
      .onConflict((oc) =>
        oc.columns(['document_id', 'chunk']).doUpdateSet({
          text: sql.ref('excluded.text'),
          embedding_vector: sql.ref('excluded.embedding_vector'),
          updated_at: new Date(),
        })
      )
      .execute();
  }
};
