import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';
import { extractEntryText } from '@colanode/core';
import { CreateEntryEmbedding } from '@/data/schema';

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

export const embedEntryHandler: JobHandler<EmbedEntryInput> = async (input) => {
  if (!aiSettings.enabled) {
    return;
  }

  const { entryId } = input;

  const entry = await database
    .selectFrom('entries')
    .select(['id', 'attributes', 'parent_id', 'root_id', 'workspace_id'])
    .where('id', '=', entryId)
    .executeTakeFirst();

  if (!entry) {
    return;
  }

  const textResult = extractEntryText(entryId, entry.attributes);
  if (textResult === undefined) {
    return;
  }

  if (textResult.text === null || textResult.text === '') {
    await database
      .deleteFrom('entry_embeddings')
      .where('entry_id', '=', entryId)
      .execute();

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
    .select(['chunk', 'text'])
    .where('entry_id', '=', entryId)
    .execute();

  const embeddingsToCreateOrUpdate: CreateEntryEmbedding[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) {
      continue;
    }

    const existingEmbedding = existingEmbeddings.find((e) => e.chunk === i);

    if (existingEmbedding && existingEmbedding.text === chunk) {
      continue;
    }

    embeddingsToCreateOrUpdate.push({
      entry_id: entryId,
      chunk: i,
      parent_id: entry.parent_id,
      root_id: entry.root_id,
      workspace_id: entry.workspace_id,
      text: chunk,
      embedding_vector: [],
      created_at: new Date(),
    });
  }

  const batchSize = aiSettings.openai.embeddingBatchSize;
  for (let i = 0; i < embeddingsToCreateOrUpdate.length; i += batchSize) {
    const batch = embeddingsToCreateOrUpdate.slice(i, i + batchSize);
    const textsToEmbed = batch.map((item) => item.text);
    const embeddingVectors = await embeddings.embedDocuments(textsToEmbed);

    for (let j = 0; j < batch.length; j++) {
      const vector = embeddingVectors[j];
      const batchItem = batch[j];
      if (vector && batchItem) {
        batchItem.embedding_vector = vector;
      }
    }
  }

  if (embeddingsToCreateOrUpdate.length == 0) {
    return;
  }

  await database
    .insertInto('entry_embeddings')
    .values(embeddingsToCreateOrUpdate)
    .onConflict((oc) =>
      oc.columns(['entry_id', 'chunk']).doUpdateSet((eb) => ({
        text: eb.ref('excluded.text'),
        embedding_vector: eb.ref('excluded.embedding_vector'),
        updated_at: new Date(),
      }))
    )
    .execute();
};
