export const aiSettings = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    embeddingModel: 'text-embedding-3-large',
    embeddingDimensions: 2000,
  },

  chunking: {
    defaultChunkSize: 1000,
    defaultOverlap: 200,
    enhanceWithContext: true,
    contextEnhancerModel: 'gpt-4o-mini',
    contextEnhancerTemperature: 0.3,
  },
};