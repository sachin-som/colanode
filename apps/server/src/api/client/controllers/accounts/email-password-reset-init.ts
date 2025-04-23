import { Request, Response } from 'express';
import {
  generateId,
  IdType,
  ApiErrorCode,
  EmailPasswordResetInitInput,
  EmailPasswordResetInitOutput,
} from '@colanode/core';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { rateLimitService } from '@/services/rate-limit-service';
import { configuration } from '@/lib/configuration';
import { generateOtpCode, saveOtp } from '@/lib/otps';
import { AccountPasswordResetOtpAttributes, Otp } from '@/types/otps';
import { jobService } from '@/services/job-service';

export const emailPasswordResetInitHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ip = res.locals.ip;
  const isIpRateLimited = await rateLimitService.isAuthIpRateLimitted(ip);
  if (isIpRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const input: EmailPasswordResetInitInput = req.body;
  const email = input.email.toLowerCase();

  const isEmailRateLimited =
    await rateLimitService.isAuthEmailRateLimitted(email);
  if (isEmailRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const id = generateId(IdType.OtpCode);
  const expiresAt = new Date(
    Date.now() + configuration.account.otpTimeout * 1000
  );
  const otpCode = await generateOtpCode();

  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  if (!account) {
    const output: EmailPasswordResetInitOutput = {
      id,
      expiresAt,
    };
    return ResponseBuilder.success(res, output);
  }

  const otp: Otp<AccountPasswordResetOtpAttributes> = {
    id,
    expiresAt,
    otp: otpCode,
    attributes: {
      accountId: account.id,
      attempts: 0,
    },
  };

  await saveOtp(id, otp);
  await jobService.addJob({
    type: 'send_email_password_reset_email',
    otpId: id,
  });

  const output: EmailPasswordResetInitOutput = {
    id,
    expiresAt,
  };
  return ResponseBuilder.success(res, output);
};
