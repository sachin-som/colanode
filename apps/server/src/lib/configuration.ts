export interface Configuration {
  server: ServerConfiguration;
  account: AccountConfiguration;
  user: UserConfiguration;
  postgres: PostgresConfiguration;
  redis: RedisConfiguration;
  avatarS3: S3Configuration;
  fileS3: S3Configuration;
  smtp: SmtpConfiguration;
  ai: AiConfiguration;
}

export type ServerMode = 'standalone' | 'cluster';

export interface ServerConfiguration {
  name: string;
  avatar: string;
  mode: ServerMode;
}

export type AccountVerificationType = 'automatic' | 'manual' | 'email';
export interface AccountConfiguration {
  verificationType: AccountVerificationType;
  otpTimeout: number;
  allowGoogleLogin: boolean;
}

export interface UserConfiguration {
  storageLimit: bigint;
  maxFileSize: bigint;
}

export interface PostgresConfiguration {
  url: string;
  ssl: {
    rejectUnauthorized?: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
}

export interface RedisConfiguration {
  url: string;
  db: number;
  jobs: {
    prefix: string;
    name: string;
  };
  eventsChannel: string;
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
  from: {
    email: string;
    name: string;
  };
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
    mode: (getOptionalEnv('SERVER_MODE') as ServerMode) || 'standalone',
  },
  account: {
    verificationType:
      (getOptionalEnv(
        'ACCOUNT_VERIFICATION_TYPE'
      ) as AccountVerificationType) || 'manual',
    otpTimeout: parseInt(getOptionalEnv('ACCOUNT_OTP_TIMEOUT') || '600'),
    allowGoogleLogin: getOptionalEnv('ACCOUNT_ALLOW_GOOGLE_LOGIN') === 'true',
  },
  user: {
    storageLimit: BigInt(getOptionalEnv('USER_STORAGE_LIMIT') || '10737418240'),
    maxFileSize: BigInt(getOptionalEnv('USER_MAX_FILE_SIZE') || '104857600'),
  },
  postgres: {
    url: getRequiredEnv('POSTGRES_URL'),
    ssl: {
      rejectUnauthorized:
        getOptionalEnv('POSTGRES_SSL_REJECT_UNAUTHORIZED') === undefined
          ? undefined
          : getOptionalEnv('POSTGRES_SSL_REJECT_UNAUTHORIZED') === 'true',
      ca: getOptionalEnv('POSTGRES_SSL_CA'),
      key: getOptionalEnv('POSTGRES_SSL_KEY'),
      cert: getOptionalEnv('POSTGRES_SSL_CERT'),
    },
  },
  redis: {
    url: getRequiredEnv('REDIS_URL'),
    db: parseInt(getOptionalEnv('REDIS_DB') || '0'),
    jobs: {
      name: getOptionalEnv('REDIS_JOBS_QUEUE_NAME') || 'jobs',
      prefix: getOptionalEnv('REDIS_JOBS_QUEUE_PREFIX') || 'colanode',
    },
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
    from: {
      email: getRequiredEnv('SMTP_EMAIL_FROM'),
      name: getRequiredEnv('SMTP_EMAIL_FROM_NAME'),
    },
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
