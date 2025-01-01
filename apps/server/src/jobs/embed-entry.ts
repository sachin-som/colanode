import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { Document } from 'langchain/document';
import { database } from '@/data/database';
import { generateId, IdType } from '@colanode/core';

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

  //TODO: use extractEntryText from packages/core/src/lib/texts.ts
  const chunkingService = new ChunkingService();
    const chunks = await chunkingService.chunkText(entryText);
  
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
            entity_type: 'message',
            embedding: embedding,
            content: chunk,
            metadata,
            created_at: new Date(),
          })
        .execute();
    }
};
