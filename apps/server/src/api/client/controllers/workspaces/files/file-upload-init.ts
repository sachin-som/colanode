import { Request, Response } from 'express';
import {
  CreateUploadInput,
  CreateUploadOutput,
  ApiErrorCode,
  generateId,
  IdType,
} from '@colanode/core';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { mapNode } from '@/lib/nodes';
import { buildFilePath, buildUploadUrl } from '@/lib/files';
import { SelectUser } from '@/data/schema';

export const fileUploadInitHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input = req.body as CreateUploadInput;
  const user = res.locals.user as SelectUser;

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

  if (node.created_by !== user.id) {
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

  const upload = await database
    .selectFrom('uploads')
    .selectAll()
    .where('file_id', '=', input.fileId)
    .executeTakeFirst();

  if (upload && upload.uploaded_at) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileAlreadyUploaded,
      message: 'This file is already uploaded.',
    });
  }

  const storageUsedRow = await database
    .selectFrom('uploads')
    .select(({ fn }) => [fn.sum('size').as('storage_used')])
    .where('created_by', '=', res.locals.user.id)
    .executeTakeFirst();

  const storageUsed = BigInt(storageUsedRow?.storage_used ?? 0);
  const storageLimit = user.storage_limit;

  if (storageUsed >= storageLimit) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileUploadInitFailed,
      message: 'You have reached the maximum storage limit.',
    });
  }

  const path = buildFilePath(node.workspace_id, input.fileId, file.attributes);
  const uploadId = generateId(IdType.Upload);
  const upsertedUpload = await database
    .insertInto('uploads')
    .values({
      file_id: input.fileId,
      upload_id: uploadId,
      workspace_id: node.workspace_id,
      root_id: node.id,
      mime_type: file.attributes.mimeType,
      size: file.attributes.size,
      path: path,
      version_id: file.attributes.version,
      created_at: new Date(),
      created_by: res.locals.user.id,
    })
    .onConflict((b) =>
      b.columns(['file_id']).doUpdateSet({
        upload_id: uploadId,
        mime_type: file.attributes.mimeType,
        size: file.attributes.size,
        path: path,
        version_id: file.attributes.version,
        created_at: new Date(),
        created_by: res.locals.user.id,
      })
    )
    .executeTakeFirst();

  if (!upsertedUpload) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileUploadInitFailed,
      message: 'Failed to initialize file upload.',
    });
  }

  const presignedUrl = await buildUploadUrl(
    path,
    file.attributes.size,
    file.attributes.mimeType
  );

  const output: CreateUploadOutput = {
    url: presignedUrl,
    uploadId: uploadId,
  };

  return ResponseBuilder.success(res, output);
};
