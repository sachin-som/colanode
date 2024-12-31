import { Request, Response } from 'express';
import {
  AccountStatus,
  EmailRegisterInput,
  generateId,
  IdType,
  ApiErrorCode,
} from '@colanode/core';
import bcrypt from 'bcrypt';
import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { accountService } from '@/services/account-service';
import { ResponseBuilder } from '@/lib/response-builder';

const SaltRounds = 10;

export const registerWithEmailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: EmailRegisterInput = req.body;
  const email = input.email.toLowerCase();

  const existingAccount = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  const salt = await bcrypt.genSalt(SaltRounds);
  const preHashedPassword = sha256(input.password);
  const password = await bcrypt.hash(preHashedPassword, salt);

  let account: SelectAccount | null | undefined = null;
  if (existingAccount) {
    if (existingAccount.status !== AccountStatus.Pending) {
      return ResponseBuilder.badRequest(res, {
        code: ApiErrorCode.EmailAlreadyExists,
        message: 'Email already exists. Login or use another email.',
      });
    }

    account = await database
      .updateTable('accounts')
      .set({
        password: password,
        name: input.name,
        updated_at: new Date(),
        status: AccountStatus.Active,
      })
      .where('id', '=', existingAccount.id)
      .returningAll()
      .executeTakeFirst();
  } else {
    account = await database
      .insertInto('accounts')
      .values({
        id: generateId(IdType.Account),
        name: input.name,
        email: email,
        password: password,
        status: AccountStatus.Active,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  }

  if (!account) {
    return ResponseBuilder.badRequest(res, {
      code: ApiErrorCode.AccountCreationFailed,
      message: 'Failed to create account.',
    });
  }

  const output = await accountService.buildLoginOutput(account);
  return ResponseBuilder.success(res, output);
};
