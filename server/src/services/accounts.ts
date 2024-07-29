import {prisma} from "@/data/db";
import {Account} from "@/types/accounts";
import bcrypt from 'bcrypt';

const SaltRounds = 10;

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const account = await prisma
    .accounts
    .findUnique({
      where: {
        email
      }
    });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    password: account.password,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    status: account.status,
    attrs: account.attrs as Record<string, any>,
  };
}

export async function updateGoogleId(accountId: string, googleId: string): Promise<void> {
  await prisma
    .accounts
    .update({
      where: {
        id: accountId
      },
      data: {
        attrs: { googleId },
        updatedAt: new Date()
      }
    });
}

export async function createAccount(account: Account): Promise<Account> {
  const newAccount = await prisma
    .accounts
    .create({
      data: {
        id: account.id,
        name: account.name,
        email: account.email,
        password: account.password,
        createdAt: account.createdAt,
        status: account.status,
        attrs: account.attrs
      }
    });

  return {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    password: newAccount.password,
    createdAt: newAccount.createdAt,
    updatedAt: newAccount.updatedAt,
    status: newAccount.status,
    attrs: newAccount.attrs as Record<string, any>,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SaltRounds);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
