import { Request, Response } from 'express';
import {
  AccountStatus,
  generateId,
  GoogleLoginInput,
  GoogleUserInfo,
  IdType,
  ApiErrorCode,
} from '@colanode/core';
import axios from 'axios';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { rateLimitService } from '@/services/rate-limit-service';
import { configuration } from '@/lib/configuration';
import { buildLoginSuccessOutput } from '@/lib/accounts';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';

export const loginWithGoogleHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!configuration.account.allowGoogleLogin) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.GoogleAuthFailed,
      message: 'Google login is not allowed.',
    });
  }

  const ip = res.locals.ip;
  const isIpRateLimited = await rateLimitService.isAuthIpRateLimitted(ip);
  if (isIpRateLimited) {
    return ResponseBuilder.tooManyRequests(res, {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many authentication attempts. Please try again later.',
    });
  }

  const input: GoogleLoginInput = req.body;
  const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
  const userInfoResponse = await axios.get(url);

  if (userInfoResponse.status !== 200) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  const googleUser: GoogleUserInfo = userInfoResponse.data;

  if (!googleUser) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
  }

  const existingAccount = await database
    .selectFrom('accounts')
    .where('email', '=', googleUser.email)
    .selectAll()
    .executeTakeFirst();

  if (existingAccount) {
    if (existingAccount.status !== AccountStatus.Active) {
      await database
        .updateTable('accounts')
        .set({
          attrs: JSON.stringify({ googleId: googleUser.id }),
          updated_at: new Date(),
          status: AccountStatus.Active,
        })
        .where('id', '=', existingAccount.id)
        .execute();
    }

    const output = await buildLoginSuccessOutput(existingAccount, {
      ip: res.locals.ip,
      platform: input.platform,
      version: input.version,
    });
    return ResponseBuilder.success(res, output);
  }

  const newAccount = await database
    .insertInto('accounts')
    .values({
      id: generateId(IdType.Account),
      name: googleUser.name,
      email: googleUser.email,
      status: AccountStatus.Active,
      created_at: new Date(),
      password: null,
      attrs: JSON.stringify({ googleId: googleUser.id }),
    })
    .returningAll()
    .executeTakeFirst();

  if (!newAccount) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountCreationFailed,
      message: 'Failed to create account.',
    });
  }

  const output = await buildLoginSuccessOutput(newAccount, {
    ip: res.locals.ip,
    platform: input.platform,
    version: input.version,
  });
  return ResponseBuilder.success(res, output);
};
