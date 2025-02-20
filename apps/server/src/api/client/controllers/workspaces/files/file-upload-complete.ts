import { Request, Response } from 'express';
import { FileStatus, ApiErrorCode } from '@colanode/core';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { mapNode, updateNode } from '@/lib/nodes';
import { fetchFileMetadata } from '@/lib/files';

export const fileUploadCompleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const fileId = req.params.fileId as string;
  const uploadId = req.body.uploadId as string;

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

  const upload = await database
    .selectFrom('uploads')
    .selectAll()
    .where('file_id', '=', fileId)
    .executeTakeFirst();

  if (!upload) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileUploadNotFound,
      message: 'Upload not found.',
    });
  }

  if (upload.file_id !== fileId || upload.upload_id !== uploadId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileUploadNotFound,
      message: 'Upload not found.',
    });
  }

  const path = upload.path;
  const metadata = await fetchFileMetadata(path);
  if (metadata === null) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (metadata.size !== file.attributes.size) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileSizeMismatch,
      message: 'Uploaded file size does not match expected size',
    });
  }

  if (metadata.mimeType !== file.attributes.mimeType) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileMimeTypeMismatch,
      message: 'Uploaded file type does not match expected type',
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

  await database
    .updateTable('uploads')
    .set({
      uploaded_at: new Date(),
    })
    .where('file_id', '=', fileId)
    .execute();

  return ResponseBuilder.success(res, {
    success: true,
  });
};
