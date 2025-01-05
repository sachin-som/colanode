import { NextFunction, Request, Response, RequestHandler } from 'express';
import { ApiErrorCode } from '@colanode/core';

import { parseToken, verifyToken } from '@/lib/tokens';
import { ResponseBuilder } from '@/lib/response-builder';
import { rateLimitService } from '@/services/rate-limit-service';

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

  const tokenData = parseToken(token);
  const isRateLimited = await rateLimitService.isDeviceApiRateLimitted(
    tokenData.deviceId
  );

  if (isRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many requests from this device. Please try again later.',
    });
  }

  const result = await verifyToken(tokenData);
  if (!result.authenticated) {
    return ResponseBuilder.unauthorized(res, {
      code: ApiErrorCode.TokenInvalid,
      message: 'Token is invalid or expired',
    });
  }

  res.locals.account = result.account;
  next();
};
