import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';
import { extractEntryText } from '@colanode/core';

export type EmbedEntryInput = {
  type: 'embed_entry';
  entryId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    embed_entry: {
      input: EmbedEntryInput;
    };
  }
}

export const embedEntryHandler: JobHandler<EmbedEntryInput> = async (
  input
) => {
  const { entryId } = input;

  const entry = await database
    .selectFrom('entries')
    .select(['id', 'attributes', 'parent_id', 'root_id', 'workspace_id'])
    .where('id', '=', entryId)
    .executeTakeFirst();

  if (!entry) {
    throw new Error(`Entry ${entryId} not found`);
  }

  const textResult = extractEntryText(entryId, entry.attributes);
  if (!textResult?.text) {
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(textResult.text);

  const embeddings = new OpenAIEmbeddings({
    apiKey: aiSettings.openai.apiKey,
    modelName: aiSettings.openai.embeddingModel,
    dimensions: aiSettings.openai.embeddingDimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('entry_embeddings')
    .select(['chunk', 'content'])
    .where('entry_id', '=', entryId)
    .execute();

  const embeddingsToCreateOrUpdate: {
    entry_id: string;
    chunk: number;
    parent_id: string;
    root_id: string;
    workspace_id: string;
    content: string;
    embedding: number[];
    metadata: string | null;
  }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) {
      continue;
    }

    const existingEmbedding = existingEmbeddings.find(
      (e) => e.chunk === i
    );

    if (existingEmbedding && existingEmbedding.content === chunk) {
      continue;
    }

    embeddingsToCreateOrUpdate.push({
      entry_id: entryId,
      chunk: i,
      parent_id: entry.parent_id,
      root_id: entry.root_id,
      workspace_id: entry.workspace_id,
      content: chunk,
      embedding: [],
      metadata: null,
    });
  }

  const batchSize = aiSettings.openai.embeddingBatchSize;
  for (let i = 0; i < embeddingsToCreateOrUpdate.length; i += batchSize) {
    const batch = embeddingsToCreateOrUpdate.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) => item.content);
    const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);

    for (let j = 0; j < batch.length; j++) {
      const vector = embeddingVectors[j];
      const batchItem = batch[j];
      if (vector && batchItem) {
        batchItem.embedding = vector;
      }
    }
  }

  for (const item of embeddingsToCreateOrUpdate) {
    if (item.embedding.length === 0) continue;

    await database
      .insertInto('entry_embeddings')
      .values({
        entry_id: item.entry_id,
        chunk: item.chunk,
        parent_id: item.parent_id,
        root_id: item.root_id,
        workspace_id: item.workspace_id,
        content: item.content,
        embedding: item.embedding,
        metadata: item.metadata,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['entry_id', 'chunk']).doUpdateSet({
          content: item.content,
          embedding: item.embedding,
          metadata: item.metadata,
          updated_at: new Date(),
        })
      )
      .execute();
  }
};