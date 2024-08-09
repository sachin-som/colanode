import {
  ApiError,
  NeuronNextFunction,
  NeuronRequest,
  NeuronResponse,
} from '@/types/api';
import { verifyJwtToken } from '@/lib/jwt';

export const authMiddleware = (
  req: NeuronRequest,
  res: NeuronResponse,
  next: NeuronNextFunction,
) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Access Denied: No Token Provided!',
    });
  }

  const payload = verifyJwtToken(token);
  if (!payload) {
    return res.status(400).json({
      code: ApiError.Unauthorized,
      message: 'Invalid Token',
    });
  }

  req.accountId = payload.id as string;
  next();
};
