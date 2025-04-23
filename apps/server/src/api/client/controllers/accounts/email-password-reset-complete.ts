import {
  AccountStatus,
  ApiErrorCode,
  EmailPasswordResetCompleteInput,
  EmailPasswordResetCompleteOutput,
} from '@colanode/core';
import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { generatePasswordHash, verifyOtpCode } from '@/lib/accounts';
import { rateLimitService } from '@/services/rate-limit-service';

export const emailPasswordResetCompleteHandler = async (
  req: Request,
  res: Response
) => {
  const ip = res.locals.ip;
  const isIpRateLimited = await rateLimitService.isAuthIpRateLimitted(ip);
  if (isIpRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const input: EmailPasswordResetCompleteInput = req.body;
  const accountId = await verifyOtpCode(input.id, input.otp);

  if (!accountId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountOtpInvalid,
      message: 'Invalid or expired code. Please request a new code.',
    });
  }

  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('id', '=', accountId)
    .executeTakeFirst();

  if (!account) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountOtpInvalid,
      message: 'Invalid or expired code. Please request a new code.',
    });
  }

  const password = await generatePasswordHash(input.password);
  const updatedAccount = await database
    .updateTable('accounts')
    .returningAll()
    .set({
      password,
      status: AccountStatus.Active,
      updated_at: new Date(),
    })
    .where('id', '=', accountId)
    .executeTakeFirst();

  if (!updatedAccount) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountOtpInvalid,
      message: 'Invalid or expired code. Please request a new code.',
    });
  }

  // automatically logout all devices
  await database
    .deleteFrom('devices')
    .where('account_id', '=', accountId)
    .execute();

  const output: EmailPasswordResetCompleteOutput = {
    success: true,
  };
  return ResponseBuilder.success(res, output);
};
