import { Request, Response } from 'express';
import {
  CreateDownloadOutput,
  hasEntryRole,
  ApiErrorCode,
} from '@colanode/core';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { database } from '@/data/database';
import { fetchEntryRole } from '@/lib/entries';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';

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

  const role = await fetchEntryRole(file.root_id, res.locals.user.id);
  if (role === null || !hasEntryRole(role, 'viewer')) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileNoAccess,
      message: 'You do not have access to this file.',
    });
  }

  //generate presigned url for download
  const path = `files/${file.workspace_id}/${file.id}${file.extension}`;
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: path,
  });

  const presignedUrl = await getSignedUrl(filesStorage, command, {
    expiresIn: 60 * 60 * 4, // 4 hours
  });

  const output: CreateDownloadOutput = {
    url: presignedUrl,
  };

  return ResponseBuilder.success(res, output);
};
