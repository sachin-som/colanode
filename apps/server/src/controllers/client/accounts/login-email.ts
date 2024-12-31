import { Request, Response } from 'express';
import { AccountStatus, EmailLoginInput, ApiErrorCode } from '@colanode/core';
import bcrypt from 'bcrypt';
import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { accountService } from '@/services/account-service';
import { ResponseBuilder } from '@/lib/response-builder';

export const loginWithEmailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

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

  const output = await accountService.buildLoginOutput(account);
  return ResponseBuilder.success(res, output);
};
