import { Request, Response } from 'express';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { FileStatus, ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { eventBus } from '@/lib/event-bus';
import { ResponseBuilder } from '@/lib/response-builder';

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
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (file.created_by !== res.locals.user.id) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileOwnerMismatch,
      message: 'You cannot complete this file upload.',
    });
  }

  if (file.workspace_id !== workspaceId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.WorkspaceMismatch,
      message: 'File does not belong to this workspace.',
    });
  }

  if (file.status === FileStatus.Ready) {
    return ResponseBuilder.success(res, {
      success: true,
    });
  }

  if (file.status === FileStatus.Error) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileError,
      message: 'File has failed to upload.',
    });
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
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.FileSizeMismatch,
        message: 'Uploaded file size does not match expected size',
      });
    }

    // Verify mime type matches expected type
    if (headObject.ContentType !== file.mime_type) {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.FileMimeTypeMismatch,
        message: 'Uploaded file type does not match expected type',
      });
    }
  } catch {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileError,
      message: 'File upload verification failed',
    });
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
    return ResponseBuilder.internalError(res, {
      code: ApiErrorCode.FileUploadCompleteFailed,
      message: 'Failed to complete file upload.',
    });
  }

  eventBus.publish({
    type: 'file_updated',
    fileId: updatedFile.id,
    rootId: updatedFile.root_id,
    workspaceId: updatedFile.workspace_id,
  });

  return ResponseBuilder.success(res, {
    success: true,
  });
};
