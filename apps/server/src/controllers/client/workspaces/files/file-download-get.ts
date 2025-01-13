import { Request, Response } from 'express';
import {
  CreateDownloadOutput,
  hasEntryRole,
  ApiErrorCode,
  extractEntryRole,
  FileStatus,
} from '@colanode/core';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { database } from '@/data/database';
import { fetchEntry, mapEntry } from '@/lib/entries';
import { fileS3 } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';
import { configuration } from '@/lib/configuration';

export const fileDownloadGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fileId = req.params.fileId as string;

  const file = await database
    .selectFrom('files')
    .selectAll()
    .where('id', '=', fileId)
    .executeTakeFirst();

  if (!file) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (file.status !== FileStatus.Ready) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotReady,
      message: 'File is not ready to be downloaded.',
    });
  }

  const root = await fetchEntry(file.root_id);
  if (!root) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.RootNotFound,
      message: 'Root not found.',
    });
  }

  const role = extractEntryRole(mapEntry(root), res.locals.user.id);
  if (role === null || !hasEntryRole(role, 'viewer')) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileNoAccess,
      message: 'You do not have access to this file.',
    });
  }

  //generate presigned url for download
  const path = `files/${file.workspace_id}/${file.id}${file.extension}`;
  const command = new GetObjectCommand({
    Bucket: configuration.fileS3.bucketName,
    Key: path,
  });

  const presignedUrl = await getSignedUrl(fileS3, command, {
    expiresIn: 60 * 60 * 4, // 4 hours
  });

  const output: CreateDownloadOutput = {
    url: presignedUrl,
  };

  return ResponseBuilder.success(res, output);
};
