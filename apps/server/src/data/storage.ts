import { S3Client } from '@aws-sdk/client-s3';

import { configuration } from '@/lib/configuration';

export const avatarS3 = new S3Client({
  endpoint: configuration.avatarS3.endpoint,
  region: configuration.avatarS3.region,
  credentials: {
    accessKeyId: configuration.avatarS3.accessKey,
    secretAccessKey: configuration.avatarS3.secretKey,
  },
});

export const fileS3 = new S3Client({
  endpoint: configuration.fileS3.endpoint,
  region: configuration.fileS3.region,
  credentials: {
    accessKeyId: configuration.fileS3.accessKey,
    secretAccessKey: configuration.fileS3.secretKey,
  },
});
