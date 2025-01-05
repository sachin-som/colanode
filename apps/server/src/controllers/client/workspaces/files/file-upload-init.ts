import { Request, Response } from 'express';
import {
  CreateUploadInput,
  CreateUploadOutput,
  ApiErrorCode,
} from '@colanode/core';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { database } from '@/data/database';
import { fileS3 } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';
import { configuration } from '@/lib/configuration';

export const fileUploadInitHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input = req.body as CreateUploadInput;

  const file = await database
    .selectFrom('files')
    .selectAll()
    .where('id', '=', input.fileId)
    .executeTakeFirst();

  if (!file) {
    return ResponseBuilder.notFound(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (file.created_by !== res.locals.user.id) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileOwnerMismatch,
      message: 'You do not have access to this file.',
    });
  }

  //generate presigned url for upload
  const path = `files/${workspaceId}/${input.fileId}${file.extension}`;
  const command = new PutObjectCommand({
    Bucket: configuration.fileS3.bucketName,
    Key: path,
    ContentLength: file.size,
    ContentType: file.mime_type,
  });

  const expiresIn = 60 * 60 * 4; // 4 hours
  const presignedUrl = await getSignedUrl(fileS3, command, {
    expiresIn,
  });

  const output: CreateUploadOutput = {
    url: presignedUrl,
  };

  return ResponseBuilder.success(res, output);
};
