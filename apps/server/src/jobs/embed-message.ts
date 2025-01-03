import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';
import { CreateMessageEmbedding } from '@/data/schema';

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
  if (!aiSettings.enabled) {
    return;
  }
  
  const { messageId } = input;

  const message = await database
    .selectFrom('messages')
    .selectAll()
    .where('id', '=', messageId)
    .executeTakeFirst();

  if (!message) {
    return;
  }

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(message.content);

  const embeddings = new OpenAIEmbeddings({
    apiKey: aiSettings.openai.apiKey,
    modelName: aiSettings.openai.embeddingModel,
    dimensions: aiSettings.openai.embeddingDimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('message_embeddings')
    .select(['chunk', 'text'])
    .where('message_id', '=', messageId)
    .execute();

  const embeddingsToCreateOrUpdate: CreateMessageEmbedding[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) {
      continue;
    }

    const existingEmbedding = existingEmbeddings.find(
      (e) => e.chunk === i
    );

    if (existingEmbedding && existingEmbedding.text === chunk) {
      continue;
    }

    embeddingsToCreateOrUpdate.push({
      message_id: messageId,
      chunk: i,
      parent_id: message.parent_id,
      entry_id: message.entry_id,
      root_id: message.root_id,
      workspace_id: message.workspace_id,
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
    .insertInto('message_embeddings')
    .values(embeddingsToCreateOrUpdate)
    .onConflict((oc) =>
      oc.columns(['message_id', 'chunk']).doUpdateSet((eb) => ({
        text: eb.ref('excluded.text'),
        embedding_vector: eb.ref('excluded.embedding_vector'),
        updated_at: new Date(),
      }))
    )
    .execute();
};