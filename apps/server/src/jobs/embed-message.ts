import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';
import { generateId, IdType } from '@colanode/core';

export type EmbedMessageInput = {
  type: 'embed_message';
  messageId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    embed_message: {
      input: EmbedMessageInput;
    };
  }
}

export const embedMessageHandler: JobHandler<EmbedMessageInput> = async (
  input
) => {
  const { messageId } = input;

  const message = await database
    .selectFrom('messages')
    .selectAll()
    .where('id', '=', messageId)
    .executeTakeFirst();

  if (!message) {
    return;
  }
  if (!message.content) {
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(message.content);

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
          entity_id: messageId,
          entity_type: 'message',
          embedding: embedding,
          content: chunk,
          metadata,
          created_at: new Date(),
        })
      .execute();
  }
};