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
import { accountService } from '@/services/account-service';
import { ResponseBuilder } from '@/lib/response-builder';
const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';

export const loginWithGoogleHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const attrs = existingAccount.attrs
      ? JSON.parse(existingAccount.attrs)
      : {};

    if (attrs?.googleId || existingAccount.status === AccountStatus.Pending) {
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

    const output = await accountService.buildLoginOutput(existingAccount);
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
    })
    .returningAll()
    .executeTakeFirst();

  if (!newAccount) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountCreationFailed,
      message: 'Failed to create account.',
    });
  }

  const output = await accountService.buildLoginOutput(newAccount);
  return ResponseBuilder.success(res, output);
};
