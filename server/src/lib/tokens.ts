import { database } from '@/data/database';
import { uuid } from '@/lib/utils';
import { NeuronRequestAccount } from '@/types/api';
import { sha256 } from 'js-sha256';

interface GenerateTokenResult {
  token: string;
  salt: string;
  hash: string;
}

type VerifyTokenResult =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      account: NeuronRequestAccount;
    };

export const generateToken = (id: string): GenerateTokenResult => {
  const salt = uuid();
  const secret = uuid() + uuid();
  const token = id + secret;
  const hash = sha256(secret + salt);

  return {
    token,
    salt,
    hash,
  };
};

export const verifyToken = async (
  token: string,
): Promise<VerifyTokenResult> => {
  const id = token.slice(0, 28);
  const secret = token.slice(28);

  const accountDevice = await database
    .selectFrom('account_devices')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  if (!accountDevice) {
    return {
      authenticated: false,
    };
  }

  if (
    !verifySecret(secret, accountDevice.token_salt, accountDevice.token_hash)
  ) {
    return {
      authenticated: false,
    };
  }

  return {
    authenticated: true,
    account: {
      id: accountDevice.account_id,
      deviceId: accountDevice.id,
    },
  };
};

const verifySecret = (secret: string, salt: string, hash: string): boolean => {
  const computedHash = sha256(secret + salt);
  return computedHash === hash;
};
