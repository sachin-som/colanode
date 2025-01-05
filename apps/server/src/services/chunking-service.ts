import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage } from '@langchain/core/messages';

import { configuration } from '@/lib/configuration';

export class ChunkingService {
  public async chunkText(text: string): Promise<string[]> {
    const chunkSize = configuration.ai.chunking.defaultChunkSize;
    const chunkOverlap = configuration.ai.chunking.defaultOverlap;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const docs = await splitter.createDocuments([text]);
    let chunks = docs.map((doc) => doc.pageContent);

    chunks = chunks.filter((c) => c.trim().length > 10);

    if (configuration.ai.chunking.enhanceWithContext) {
      const enriched: string[] = [];
      for (const chunk of chunks) {
        const c = await this.addContextToChunk(chunk, text);
        enriched.push(c);
      }
      return enriched;
    }

    return chunks;
  }

  private async addContextToChunk(
    chunk: string,
    fullText: string
  ): Promise<string> {
    try {
      const chat = new ChatOpenAI({
        openAIApiKey: configuration.ai.openai.apiKey,
        modelName: configuration.ai.chunking.contextEnhancerModel,
        temperature: configuration.ai.chunking.contextEnhancerTemperature,
        maxTokens: 200,
      });

      const prompt = `
<document>
${fullText}
</document>

Here is the chunk we want to situate in context:
<chunk>
${chunk}
</chunk>

Generate a short (50-100 tokens) contextual prefix that seamlessly provides background or location info for the chunk. Then include the original chunk text below it without any extra separator.
      `;

      const response = await chat.invoke([new SystemMessage(prompt)]);
      const context = (response.content.toString() ?? '').trim();

      return `${context} ${chunk}`;
    } catch (err) {
      console.error('Error adding context to chunk:', err);
      return chunk;
    }
  }
}
