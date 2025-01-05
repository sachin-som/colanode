export interface Configuration {
  server: ServerConfiguration;
  postgres: PostgresConfiguration;
  redis: RedisConfiguration;
  avatarS3: S3Configuration;
  fileS3: S3Configuration;
  smtp: SmtpConfiguration;
  ai: AiConfiguration;
}

export interface ServerConfiguration {
  name: string;
  avatar: string;
}

export interface PostgresConfiguration {
  url: string;
}

export interface RedisConfiguration {
  url: string;
  host: string;
  port: number;
  password: string;
  db: number;
  eventsChannel: string;
  jobsQueueName: string;
}

export interface S3Configuration {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
}

export interface SmtpConfiguration {
  host: string;
  port: number;
  user: string;
  password: string;
  emailFrom: string;
}

export interface AiConfiguration {
  enabled: boolean;
  entryEmbedDelay: number;
  openai: OpenAiConfiguration;
  chunking: ChunkingConfiguration;
}

export interface OpenAiConfiguration {
  apiKey: string;
  embeddingModel: string;
  embeddingDimensions: number;
  embeddingBatchSize: number;
}

export interface ChunkingConfiguration {
  defaultChunkSize: number;
  defaultOverlap: number;
  enhanceWithContext: boolean;
  contextEnhancerModel: string;
  contextEnhancerTemperature: number;
}

const getRequiredEnv = (env: string): string => {
  const value = process.env[env];
  if (!value) {
    throw new Error(`${env} is not set`);
  }

  return value;
};

const getOptionalEnv = (env: string): string | undefined => {
  return process.env[env];
};

export const configuration: Configuration = {
  server: {
    name: getRequiredEnv('SERVER_NAME'),
    avatar: getOptionalEnv('SERVER_AVATAR') || '',
  },
  postgres: {
    url: getRequiredEnv('POSTGRES_URL'),
  },
  redis: {
    url: getRequiredEnv('REDIS_URL'),
    host: getRequiredEnv('REDIS_HOST'),
    port: parseInt(getOptionalEnv('REDIS_PORT') || '6379'),
    password: getRequiredEnv('REDIS_PASSWORD'),
    db: parseInt(getOptionalEnv('REDIS_DB') || '0'),
    jobsQueueName: getOptionalEnv('REDIS_JOBS_QUEUE_NAME') || 'jobs',
    eventsChannel: getOptionalEnv('REDIS_EVENTS_CHANNEL') || 'events',
  },
  avatarS3: {
    endpoint: getRequiredEnv('S3_AVATARS_ENDPOINT'),
    accessKey: getRequiredEnv('S3_AVATARS_ACCESS_KEY'),
    secretKey: getRequiredEnv('S3_AVATARS_SECRET_KEY'),
    bucketName: getRequiredEnv('S3_AVATARS_BUCKET_NAME'),
    region: getRequiredEnv('S3_AVATARS_REGION'),
  },
  fileS3: {
    endpoint: getRequiredEnv('S3_FILES_ENDPOINT'),
    accessKey: getRequiredEnv('S3_FILES_ACCESS_KEY'),
    secretKey: getRequiredEnv('S3_FILES_SECRET_KEY'),
    bucketName: getRequiredEnv('S3_FILES_BUCKET_NAME'),
    region: getRequiredEnv('S3_FILES_REGION'),
  },
  smtp: {
    host: getOptionalEnv('SMTP_HOST') || '',
    port: parseInt(getOptionalEnv('SMTP_PORT') || '587'),
    user: getOptionalEnv('SMTP_USER') || '',
    password: getOptionalEnv('SMTP_PASSWORD') || '',
    emailFrom: getOptionalEnv('SMTP_EMAIL_FROM') || '',
  },
  ai: {
    enabled: getOptionalEnv('AI_ENABLED') === 'true',
    entryEmbedDelay: parseInt(
      getOptionalEnv('AI_ENTRY_EMBED_DELAY') || '60000'
    ),
    openai: {
      apiKey: getOptionalEnv('OPENAI_API_KEY') || '',
      embeddingModel: getOptionalEnv('OPENAI_EMBEDDING_MODEL') || '',
      embeddingDimensions: parseInt(
        getOptionalEnv('OPENAI_EMBEDDING_DIMENSIONS') || '2000'
      ),
      embeddingBatchSize: parseInt(
        getOptionalEnv('OPENAI_EMBEDDING_BATCH_SIZE') || '50'
      ),
    },
    chunking: {
      defaultChunkSize: parseInt(
        getOptionalEnv('CHUNK_DEFAULT_CHUNK_SIZE') || '1000'
      ),
      defaultOverlap: parseInt(
        getOptionalEnv('CHUNK_DEFAULT_OVERLAP') || '200'
      ),
      enhanceWithContext:
        getOptionalEnv('CHUNK_ENHANCE_WITH_CONTEXT') === 'true',
      contextEnhancerModel:
        getOptionalEnv('CHUNK_CONTEXT_ENHANCER_MODEL') || 'gpt-4o-mini',
      contextEnhancerTemperature: parseFloat(
        getOptionalEnv('CHUNK_CONTEXT_ENHANCER_TEMPERATURE') || '0.3'
      ),
    },
  },
};
