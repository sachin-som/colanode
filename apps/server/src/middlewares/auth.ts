import { NextFunction, Request, Response, RequestHandler } from 'express';
import { ApiErrorCode } from '@colanode/core';

import { verifyToken } from '@/lib/tokens';
import { ResponseBuilder } from '@/lib/response-builder';

export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return ResponseBuilder.unauthorized(res, {
      code: ApiErrorCode.TokenMissing,
      message: 'No token provided',
    });
  }

  const result = await verifyToken(token);
  if (!result.authenticated) {
    return ResponseBuilder.unauthorized(res, {
      code: ApiErrorCode.TokenInvalid,
      message: 'Token is invalid or expired',
    });
  }

  res.locals.account = result.account;
  next();
};
