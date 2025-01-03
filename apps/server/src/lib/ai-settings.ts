export const aiSettings = {
  enabled: false,
  embedDelay: 60000,

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: 'text-embedding-3-large',
    embeddingDimensions: 2000,
    embeddingBatchSize: 50,
  },

  chunking: {
    defaultChunkSize: 1000,
    defaultOverlap: 200,
    enhanceWithContext: true,
    contextEnhancerModel: 'gpt-4o-mini',
    contextEnhancerTemperature: 0.3,
  },
};
