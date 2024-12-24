import { Request, Response } from 'express';
import { CreateDownloadOutput, hasViewerAccess } from '@colanode/core';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { fetchEntryRole } from '@/lib/entries';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';

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
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'File not found.',
    });
    return;
  }

  const role = await fetchEntryRole(file.root_id, res.locals.user.id);
  if (role === null || !hasViewerAccess(role)) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
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

  res.status(200).json(output);
};
