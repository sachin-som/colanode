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
import { mapNode } from '@/lib/nodes';
import { buildFilePath } from '@/lib/files';

export const fileUploadInitHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input = req.body as CreateUploadInput;

  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', input.fileId)
    .executeTakeFirst();

  if (!node) {
    return ResponseBuilder.notFound(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (node.created_by !== res.locals.user.id) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileOwnerMismatch,
      message: 'You do not have access to this file.',
    });
  }

  //generate presigned url for upload
  const file = mapNode(node);
  if (file.type !== 'file') {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'This node is not a file.',
    });
  }

  const path = buildFilePath(workspaceId, input.fileId, file.attributes);
  const command = new PutObjectCommand({
    Bucket: configuration.fileS3.bucketName,
    Key: path,
    ContentLength: file.attributes.size,
    ContentType: file.attributes.mimeType,
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
