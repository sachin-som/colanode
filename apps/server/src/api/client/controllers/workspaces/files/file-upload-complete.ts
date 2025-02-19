import { Request, Response } from 'express';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { FileStatus, ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { fileS3 } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';
import { configuration } from '@/lib/configuration';
import { mapNode, updateNode } from '@/lib/nodes';
import { buildFilePath } from '@/lib/files';

export const fileUploadCompleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const fileId = req.params.fileId as string;

  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', fileId)
    .executeTakeFirst();

  if (!node) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (node.created_by !== res.locals.user.id) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileOwnerMismatch,
      message: 'You cannot complete this file upload.',
    });
  }

  if (node.workspace_id !== workspaceId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.WorkspaceMismatch,
      message: 'File does not belong to this workspace.',
    });
  }

  const file = mapNode(node);
  if (file.type !== 'file') {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'This node is not a file.',
    });
  }

  if (file.attributes.status === FileStatus.Ready) {
    return ResponseBuilder.success(res, {
      success: true,
    });
  }

  if (file.attributes.status === FileStatus.Error) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileError,
      message: 'File has failed to upload.',
    });
  }

  const path = buildFilePath(workspaceId, file.id, file.attributes);
  // check if the file exists in the bucket
  const command = new HeadObjectCommand({
    Bucket: configuration.fileS3.bucketName,
    Key: path,
  });

  try {
    const headObject = await fileS3.send(command);

    // Verify file size matches expected size
    if (headObject.ContentLength !== file.attributes.size) {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.FileSizeMismatch,
        message: 'Uploaded file size does not match expected size',
      });
    }

    // Verify mime type matches expected type
    if (headObject.ContentType !== file.attributes.mimeType) {
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

  const result = await updateNode({
    nodeId: fileId,
    userId: res.locals.user.id,
    workspaceId: workspaceId,
    updater(attributes) {
      if (attributes.type !== 'file') {
        throw new Error('Node is not a file');
      }

      attributes.status = FileStatus.Ready;
      return attributes;
    },
  });

  if (result === null) {
    return ResponseBuilder.internalError(res, {
      code: ApiErrorCode.FileUploadCompleteFailed,
      message: 'Failed to complete file upload.',
    });
  }

  return ResponseBuilder.success(res, {
    success: true,
  });
};
