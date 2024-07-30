import jwt from 'jsonwebtoken';
import {ApiError, NeuronNextFunction, NeuronRequest, NeuronResponse} from "@/types/api";

const JwtSecretKey = process.env.JWT_SECRET ?? '';
const JwtAudience = process.env.JWT_AUDIENCE ?? '';
const JwtIssuer = process.env.JWT_ISSUER ?? '';

export function authMiddleware(req: NeuronRequest, res: NeuronResponse, next: NeuronNextFunction) {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Access Denied: No Token Provided!'
    });
  }

  try {
    const decoded = jwt.verify(token, JwtSecretKey, {
      issuer: JwtIssuer,
      audience: JwtAudience,
    });

    req.accountId = decoded.sub as string;
    next();
  } catch (err) {
    res.status(400).json({
      code: ApiError.Unauthorized,
      message: 'Invalid Token'
    });
  }
}