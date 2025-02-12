import { Request, Response } from 'express';
import {
  CreateDownloadOutput,
  hasNodeRole,
  ApiErrorCode,
  extractNodeRole,
  FileStatus,
} from '@colanode/core';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { fetchNodeTree, mapNode } from '@/lib/nodes';
import { fileS3 } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';
import { configuration } from '@/lib/configuration';
import { buildFilePath } from '@/lib/files';

export const fileDownloadGetHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
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

  //generate presigned url for download
  const path = buildFilePath(workspaceId, file.id, file.attributes);
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
