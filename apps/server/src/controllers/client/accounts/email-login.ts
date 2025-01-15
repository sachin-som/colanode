import { Request, Response } from 'express';
import { AccountStatus, EmailLoginInput, ApiErrorCode } from '@colanode/core';
import argon2 from '@node-rs/argon2';

import { database } from '@/data/database';
import { accountService } from '@/services/account-service';
import { ResponseBuilder } from '@/lib/response-builder';
import { rateLimitService } from '@/services/rate-limit-service';
import { configuration } from '@/lib/configuration';

export const emailLoginHandler = async (
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

  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

  const isEmailRateLimited =
    await rateLimitService.isAuthEmailRateLimitted(email);
  if (isEmailRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const account = await database
    .selectFrom('accounts')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();

  if (!account || !account.password) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.EmailOrPasswordIncorrect,
      message: 'Invalid email or password.',
    });
  }

  if (account.status === AccountStatus.Unverified) {
    if (configuration.account.verificationType === 'email') {
      const output = await accountService.buildLoginVerifyOutput(account);
      return ResponseBuilder.success(res, output);
    }

    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountPendingVerification,
      message:
        'Account is not verified yet. Contact your administrator to verify your account.',
    });
  }

  const passwordMatch = await argon2.verify(account.password, input.password);

  if (!passwordMatch) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.EmailOrPasswordIncorrect,
      message: 'Invalid email or password.',
    });
  }

  const output = await accountService.buildLoginSuccessOutput(account, {
    ip: res.locals.ip,
    platform: input.platform,
    version: input.version,
  });
  return ResponseBuilder.success(res, output);
};
