import { AccountStatus, ApiErrorCode, EmailVerifyInput } from '@colanode/core';
import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ResponseBuilder } from '@/lib/response-builder';
import { accountService } from '@/services/account-service';

export const emailVerifyHandler = async (req: Request, res: Response) => {
  const input: EmailVerifyInput = req.body;
  const accountId = await accountService.verifyOtpCode(input.id, input.otp);

  if (!accountId) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountOtpInvalid,
      message: 'Invalid or expired OTP code. Please request a new OTP code.',
    });
  }

  const account = await database
    .updateTable('accounts')
    .returningAll()
    .set({
      status: AccountStatus.Active,
    })
    .where('id', '=', accountId)
    .executeTakeFirst();

  if (!account) {
    return ResponseBuilder.notFound(res, {
      code: ApiErrorCode.AccountNotFound,
      message: 'Account not found.',
    });
  }

  const output = await accountService.buildLoginSuccessOutput(
    account,
    res.locals.ip
  );
  return ResponseBuilder.success(res, output);
};
