import { Request, Response } from 'express';
import {
  CreateDownloadOutput,
  hasNodeRole,
  ApiErrorCode,
  extractNodeRole,
  FileStatus,
} from '@colanode/core';

import { fetchNodeTree, mapNode } from '@/lib/nodes';
import { ResponseBuilder } from '@/lib/response-builder';
import { database } from '@/data/database';
import { buildDownloadUrl } from '@/lib/files';

export const fileDownloadGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const fileId = req.params.fileId as string;

  const tree = await fetchNodeTree(fileId);
  if (tree.length === 0) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  const nodes = tree.map((node) => mapNode(node));
  const file = nodes[nodes.length - 1]!;
  if (!file || file.id !== fileId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'File not found.',
    });
  }

  if (file.type !== 'file') {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotFound,
      message: 'This node is not a file.',
    });
  }

  if (file.attributes.status !== FileStatus.Ready) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileNotReady,
      message: 'File is not ready to be downloaded.',
    });
  }

  const role = extractNodeRole(nodes, res.locals.user.id);
  if (role === null || !hasNodeRole(role, 'viewer')) {
    return ResponseBuilder.forbidden(res, {
      code: ApiErrorCode.FileNoAccess,
      message: 'You do not have access to this file.',
    });
  }

  const upload = await database
    .selectFrom('uploads')
    .selectAll()
    .where('file_id', '=', fileId)
    .executeTakeFirst();

  if (!upload || !upload.uploaded_at) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.FileUploadNotFound,
      message: 'File upload not found.',
    });
  }

  const presignedUrl = await buildDownloadUrl(upload.path);
  const output: CreateDownloadOutput = {
    url: presignedUrl,
  };

  return ResponseBuilder.success(res, output);
};
