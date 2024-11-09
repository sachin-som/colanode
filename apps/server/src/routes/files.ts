import { database } from '@/data/database';
import { BUCKET_NAMES, filesStorage } from '@/data/storage';
import { hasCollaboratorAccess, hasViewerAccess } from '@/lib/constants';
import { fetchNodeRole } from '@/lib/nodes';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Router } from 'express';

export const filesRouter = Router();

filesRouter.get(
  '/:workspaceId/:fileId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const fileId = req.params.fileId as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const role = await fetchNodeRole(fileId, workspaceUser.id);
    if (role === null || !hasCollaboratorAccess(role)) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const node = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'File not found.',
      });
    }

    //generate presigned url for download
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: `files/${fileId}${node.attributes.extension}`,
    });

    const presignedUrl = await getSignedUrl(filesStorage, command, {
      expiresIn: 60 * 60 * 4, // 4 hours
    });

    res.status(200).json({ url: presignedUrl });
  }
);

filesRouter.post(
  '/:workspaceId/:fileId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const fileId = req.params.fileId as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const role = await fetchNodeRole(fileId, workspaceUser.id);
    if (role === null || !hasViewerAccess(role)) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const node = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'File not found.',
      });
    }

    //generate presigned url for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAMES.FILES,
      Key: `files/${fileId}${node.attributes.extension}`,
      ContentLength: node.attributes.size,
      ContentType: node.attributes.mimeType,
    });

    const presignedUrl = await getSignedUrl(filesStorage, command, {
      expiresIn: 60 * 60 * 4, // 4 hours
    });

    res.status(200).json({ url: presignedUrl });
  }
);
