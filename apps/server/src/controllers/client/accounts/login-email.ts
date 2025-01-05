import { Request, Response } from 'express';
import { AccountStatus, EmailLoginInput, ApiErrorCode } from '@colanode/core';
import bcrypt from 'bcrypt';
import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { accountService } from '@/services/account-service';
import { ResponseBuilder } from '@/lib/response-builder';
import { rateLimitService } from '@/services/rate-limit-service';

export const loginWithEmailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const ip = res.locals.ip;
  const isIpRateLimited = await checkIpRateLimit(ip);
  if (isIpRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

  const isEmailRateLimited = await checkEmailRateLimit(email);
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

  if (account.status === AccountStatus.Pending) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountPendingActivation,
      message: 'Account is not activated yet. Register or use another email.',
    });
  }

  const preHashedPassword = sha256(input.password);
  const passwordMatch = await bcrypt.compare(
    preHashedPassword,
    account.password
  );

  if (!passwordMatch) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.EmailOrPasswordIncorrect,
      message: 'Invalid email or password.',
    });
  }

  const output = await accountService.buildLoginOutput(account, res.locals.ip);
  return ResponseBuilder.success(res, output);
};

const checkIpRateLimit = async (ip: string): Promise<boolean> => {
  const rateLimitKey = `auth_ip_${ip}`;
  return await rateLimitService.isRateLimited(rateLimitKey, {
    limit: 50,
    window: 600, // 10 minutes
  });
};

const checkEmailRateLimit = async (email: string): Promise<boolean> => {
  const emailHash = sha256(email);
  const rateLimitKey = `auth_email_${emailHash}`;
  return await rateLimitService.isRateLimited(rateLimitKey, {
    limit: 10,
    window: 600, // 10 minutes
  });
};
