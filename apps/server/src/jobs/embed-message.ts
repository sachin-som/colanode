import { JobHandler } from '@/types/jobs';
import { ChunkingService } from '@/services/chunking-service';
import { database } from '@/data/database';
import { OpenAIEmbeddings } from '@langchain/openai';
import { aiSettings } from '@/lib/ai-settings';

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

  const chunkingService = new ChunkingService();
  const chunks = await chunkingService.chunkText(message.content);

  const embeddings = new OpenAIEmbeddings({
    apiKey: aiSettings.openai.apiKey,
    modelName: aiSettings.openai.embeddingModel,
    dimensions: aiSettings.openai.embeddingDimensions,
  });

  const existingEmbeddings = await database
    .selectFrom('message_embeddings')
    .select(['chunk', 'content'])
    .where('message_id', '=', messageId)
    .execute();

  const embeddingsToCreateOrUpdate: {
    message_id: string;
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
      message_id: messageId,
      chunk: i,
      parent_id: message.parent_id,
      root_id: message.root_id,
      workspace_id: message.workspace_id,
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
      .insertInto('message_embeddings')
      .values({
        message_id: item.message_id,
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
        oc.columns(['message_id', 'chunk']).doUpdateSet({
          content: item.content,
          embedding: item.embedding,
          metadata: item.metadata,
          updated_at: new Date(),
        })
      )
      .execute();
  }
};