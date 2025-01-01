import { Request, Response } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ApiErrorCode } from '@colanode/core';

import { Readable } from 'stream';

import { avatarStorage, BUCKET_NAMES } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';

export const avatarDownloadHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const avatarId = req.params.avatarId;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAMES.AVATARS,
      Key: `avatars/${avatarId}.jpeg`,
    });

    const avatarResponse = await avatarStorage.send(command);
    if (!avatarResponse.Body) {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.AvatarNotFound,
        message: 'Avatar not found',
      });
    }

    if (avatarResponse.Body instanceof Readable) {
      avatarResponse.Body.pipe(res);
    } else {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.AvatarNotFound,
        message: 'Avatar not found',
      });
    }
  } catch {
    return ResponseBuilder.internalError(res, {
      code: ApiErrorCode.AvatarDownloadFailed,
      message: 'Failed to download avatar',
    });
  }
};
