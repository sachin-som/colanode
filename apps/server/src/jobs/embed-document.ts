import { OpenAIEmbeddings } from '@langchain/openai';
import { chunkText } from '@/lib/chunking';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateDocumentEmbedding } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNode } from '@/lib/nodes';
import { extractDocumentText } from '@colanode/core';
import { getNodeModel } from '@colanode/core';
import { enrichChunk } from '@/services/llm-service';

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

  const node = await fetchNode(documentId);
  if (!node) {
    return;
  }

  const nodeModel = getNodeModel(node.attributes.type);
  if (!nodeModel?.documentSchema) {
    return;
  }

  const text = extractDocumentText(node.id, document.content);
  if (!text || text.trim() === '') {
    await database
      .deleteFrom('document_embeddings')
      .where('document_id', '=', documentId)
      .execute();
    return;
  }

  const embeddings = new OpenAIEmbeddings({
    apiKey: configuration.ai.embedding.apiKey,
    modelName: configuration.ai.embedding.modelName,
    dimensions: configuration.ai.embedding.dimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('document_embeddings')
    .select(['chunk', 'text', 'summary'])
    .where('document_id', '=', documentId)
    .execute();

  const textChunks = await chunkText(
    text,
    existingEmbeddings.map((e) => ({
      text: e.text,
      summary: e.summary ?? undefined,
    })),
    { type: 'document', node: node },
    enrichChunk
  );

  const embeddingsToCreateOrUpdate: CreateDocumentEmbedding[] = [];
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    if (!chunk) {
      continue;
    }

    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === chunk.text) {
      continue;
    }

    embeddingsToCreateOrUpdate.push({
      document_id: documentId,
      chunk: i,
      workspace_id: document.workspace_id,
      text: chunk.text,
      summary: chunk.summary,
      embedding_vector: [],
      created_at: new Date(),
    });
  }

  const batchSize = configuration.ai.embedding.batchSize;
  for (let i = 0; i < embeddingsToCreateOrUpdate.length; i += batchSize) {
    const batch = embeddingsToCreateOrUpdate.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) =>
      item.summary ? `${item.summary}\n\n${item.text}` : item.text
    );
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
        summary: embedding.summary,
        embedding_vector: sql.raw(
          `'[${embedding.embedding_vector.join(',')}]'::vector`
        ),
        created_at: embedding.created_at,
      })
      .onConflict((oc) =>
        oc.columns(['document_id', 'chunk']).doUpdateSet({
          text: sql.ref('excluded.text'),
          summary: sql.ref('excluded.summary'),
          embedding_vector: sql.ref('excluded.embedding_vector'),
          updated_at: new Date(),
        })
      )
      .execute();
  }
};
