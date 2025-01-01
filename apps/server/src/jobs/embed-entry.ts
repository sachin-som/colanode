import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';
import { generateId, IdType, extractEntryText } from '@colanode/core';

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
    .select(['id', 'attributes'])
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

  const embeddingVectors = await embeddings.embedDocuments(chunks)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) {
      continue;
    }

    const embedding = embeddingVectors[i]
    if (!embedding) {
      continue;
    }

    const id = generateId(IdType.AiEmbedding);
    const metadata = JSON.stringify({
      chunk_index: i,
    });

    await database
      .insertInto('ai_embeddings')
      .values(
        {
          id,
          entity_id: entryId,
          entity_type: 'entry',
          embedding: embedding,
          content: chunk,
          metadata,
          created_at: new Date(),
        })
      .execute();
  }
};
