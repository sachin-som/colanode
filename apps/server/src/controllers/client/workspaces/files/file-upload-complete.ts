import { Request, Response } from 'express';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { FileStatus } from '@colanode/core';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { eventBus } from '@/lib/event-bus';

export const fileUploadCompleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
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

  if (file.created_by !== res.locals.user.id) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  if (file.workspace_id !== workspaceId) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File does not belong to this workspace.',
    });
    return;
  }

  if (file.status !== FileStatus.Pending) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File is not pending.',
    });
    return;
  }

  const path = `files/${file.workspace_id}/${file.id}${file.extension}`;
  // check if the file exists in the bucket
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAMES.FILES,
    Key: path,
  });

  try {
    const headObject = await filesStorage.send(command);

    // Verify file size matches expected size
    if (headObject.ContentLength !== file.size) {
      res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Uploaded file size does not match expected size',
      });
      return;
    }

    // Verify mime type matches expected type
    if (headObject.ContentType !== file.mime_type) {
      res.status(400).json({
        code: ApiError.BadRequest,
        message: 'Uploaded file type does not match expected type',
      });
      return;
    }
  } catch {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'File upload verification failed',
    });
    return;
  }

  const updatedFile = await database
    .updateTable('files')
    .returningAll()
    .set({
      status: FileStatus.Ready,
      updated_by: res.locals.user.id,
      updated_at: new Date(),
    })
    .where('id', '=', fileId)
    .executeTakeFirst();

  if (!updatedFile) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to update file status.',
    });
    return;
  }

  eventBus.publish({
    type: 'file_updated',
    fileId: updatedFile.id,
    rootId: updatedFile.root_id,
    workspaceId: updatedFile.workspace_id,
  });

  res.status(200).json({ success: true });
};
