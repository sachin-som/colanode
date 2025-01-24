import { Request, Response } from 'express';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ApiErrorCode, generateId, IdType } from '@colanode/core';
import multer from 'multer';

import path from 'path';

import { avatarS3 } from '@/data/storage';
import { ResponseBuilder } from '@/lib/response-builder';
import { configuration } from '@/lib/configuration';

const storage = multer.memoryStorage();
const uploadMulter = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

export const avatarUploadParameter = uploadMulter.single('avatar');

export const avatarUploadHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.AvatarFileNotUploaded,
        message: 'Avatar file not uploaded as part of request',
      });
    }

    // Resize image to a maximum of 500x500 pixels while keeping aspect ratio, and convert to JPEG using Sharp
    const jpegBuffer = await sharp(req.file.buffer)
      .resize({
        width: 500,
        height: 500,
        fit: 'inside',
      })
      .jpeg()
      .toBuffer();

    const avatarId = generateId(IdType.Avatar);
    const command = new PutObjectCommand({
      Bucket: configuration.avatarS3.bucketName,
      Key: `avatars/${avatarId}.jpeg`,
      Body: jpegBuffer,
      ContentType: 'image/jpeg',
    });

    await avatarS3.send(command);
    return ResponseBuilder.success(res, { success: true, id: avatarId });
  } catch {
    return ResponseBuilder.internalError(res, {
      code: ApiErrorCode.AvatarUploadFailed,
      message: 'Failed to upload avatar',
    });
  }
};
