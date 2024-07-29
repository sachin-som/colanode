import {Request, Response} from "express";
import {
  Account,
  AccountStatus, EmailLoginInput,
  EmailRegisterInput,
  GoogleLoginInput,
  GoogleUserInfo,
  LoginOutput
} from "@/types/accounts";
import axios from "axios";
import {ApiError} from "@/types/api";
import {createAccount, findAccountByEmail, hashPassword, updateGoogleId, verifyPassword} from "@/services/accounts";
import {generateId, IdType} from "@/lib/id";
import jwt from "jsonwebtoken";

const GoogleUserInfoUrl = "https://www.googleapis.com/oauth2/v1/userinfo";
const JwtSecretKey = process.env.JWT_SECRET ?? '';
const JwtAudience = process.env.JWT_AUDIENCE ?? '';
const JwtIssuer = process.env.JWT_ISSUER ?? '';

function buildLoginOutput(account: Account): LoginOutput {
  const signOptions: jwt.SignOptions = {
    issuer: JwtIssuer,
    audience: JwtAudience,
    subject: account.id,
    expiresIn: '1y',
  };

  const payload = {
    name: account.name,
    email: account.email,
  };

  const token = jwt.sign(payload, JwtSecretKey, signOptions);

  return {
    token
  };
}

async function registerWithEmail(req: Request, res: Response) {
  const input: EmailRegisterInput = req.body;
  let existingUser = await findAccountByEmail(input.email);

  if (existingUser) {
    return res.status(400).json({
      code: ApiError.EmailAlreadyExists,
      message: "Email already exists."
    });
  }

  const password = await hashPassword(input.password);
  const account: Account = {
    id: generateId(IdType.Account),
    name: input.name,
    email: input.email,
    password: password,
    status: AccountStatus.Active,
    createdAt: new Date(),
  };

  await createAccount(account);
  return res.json(buildLoginOutput(account));
}

async function loginWithEmail(req: Request, res: Response) {
  const input: EmailLoginInput = req.body;
  let existingUser = await findAccountByEmail(input.email);

  if (!existingUser) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: "Invalid credentials."
    });
  }

  if (existingUser.status === AccountStatus.Pending) {
    return res.status(400).json({
      code: ApiError.UserPendingActivation,
      message: "User is pending activation."
    });
  }

  if (!existingUser.password) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: "Invalid credentials."
    });
  }

  let passwordMatch = await verifyPassword(input.password, existingUser.password);

  if (!passwordMatch) {
    return res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: "Invalid credentials."
    });
  }

  return res.json(buildLoginOutput(existingUser));
}

async function loginWithGoogle(req: Request, res: Response) {
  const input: GoogleLoginInput = req.body;
  const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
  const userInfoResponse = await axios.get(url);

  if (userInfoResponse.status !== 200) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: "Failed to authenticate with Google."
    });
  }

  const googleUser: GoogleUserInfo = userInfoResponse.data;

  if (!googleUser) {
    return res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: "Failed to authenticate with Google."
    });
  }

  let existingUser = await findAccountByEmail(googleUser.email);

  if (existingUser) {
    if (existingUser.status === AccountStatus.Pending) {
      return res.status(400).json({
        code: ApiError.UserPendingActivation,
        message: "User is pending activation."
      });
    }

    await updateGoogleId(existingUser.id, googleUser.id);
    return res.json(buildLoginOutput(existingUser));
  }

  const account: Account = {
    id: generateId(IdType.Account),
    name: googleUser.name,
    email: googleUser.email,
    status: AccountStatus.Active,
    createdAt: new Date(),
    attrs: {
      googleId: googleUser.id
    }
  };

  await createAccount(account);
    return res.json(buildLoginOutput(account));
}

export const accounts = {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail
}