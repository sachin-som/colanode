// Updated embed-document.ts
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CreateDocumentEmbedding } from '@/data/schema';
import { sql } from 'kysely';
import { fetchNodeWithContext } from '@/services/node-retrieval-service';
import { DocumentContent, extractBlockTexts } from '@colanode/core';
import { JobHandler } from '@/types/jobs';

export type EmbedDocumentInput = {
  type: 'embed_document';
  documentId: string;
};

export const embedDocumentHandler: JobHandler<EmbedDocumentInput> = async (
  input
) => {
  if (!configuration.ai.enabled) return;
  const { documentId } = input;

  // Retrieve document along with its associated node in one query
  const document = await database
    .selectFrom('documents')
    .select(['id', 'content', 'workspace_id', 'created_at'])
    .where('id', '=', documentId)
    .executeTakeFirst();
  if (!document) return;

  // Fetch associated node for context (page node, etc.)
  const nodeContext = await fetchNodeWithContext(documentId);
  // If available, include node type and parent (space) name in the context.
  let header = '';
  if (nodeContext) {
    const { node, parent, root } = nodeContext;
    header = `${node.attributes.type} "${(node.attributes as any).name || ''}"`;
    if (parent && parent.attributes.name) {
      header += ` in "${parent.attributes.name}"`;
    }
    if (root && root.attributes.name) {
      header += ` [${root.attributes.name}]`;
    }
  }

  // Extract text using document content. (For pages and rich–text, use extractBlockTexts.)
  const docText = extractBlockTexts(documentId, document.content.blocks) || '';
  const fullText = header ? `${header}\n\nContent:\n${docText}` : docText;
  if (!fullText.trim()) {
    await database
      .deleteFrom('document_embeddings')
      .where('document_id', '=', documentId)
      .execute();
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(fullText, {
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

  const embeddingsToUpsert: CreateDocumentEmbedding[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const existing = existingEmbeddings.find((e) => e.chunk === i);
    if (existing && existing.text === chunk) continue;
    embeddingsToUpsert.push({
      document_id: documentId,
      chunk: i,
      workspace_id: document.workspace_id,
      text: chunk,
      embedding_vector: [],
      created_at: new Date(),
    });
  }

  const batchSize = configuration.ai.embedding.batchSize;
  for (let i = 0; i < embeddingsToUpsert.length; i += batchSize) {
    const batch = embeddingsToUpsert.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) => item.text);
    const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);
    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding_vector = embeddingVectors[j] ?? [];
    }
  }

  for (const embedding of embeddingsToUpsert) {
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
