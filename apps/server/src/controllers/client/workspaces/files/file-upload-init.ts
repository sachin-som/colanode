import { Request, Response } from 'express';
import { CreateUploadInput, CreateUploadOutput } from '@colanode/core';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';

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
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'File not found.',
    });
    return;
  }

  if (file.created_by !== res.locals.user.id) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  //generate presigned url for upload
  const path = `files/${workspaceId}/${input.fileId}${file.extension}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: path,
    ContentLength: file.size,
    ContentType: file.mime_type,
  });

  const expiresIn = 60 * 60 * 4; // 4 hours
  const presignedUrl = await getSignedUrl(filesStorage, command, {
    expiresIn,
  });

  const output: CreateUploadOutput = {
    url: presignedUrl,
  };

  res.status(200).json(output);
};
