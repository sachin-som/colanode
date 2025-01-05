import { NextFunction, Request, Response, RequestHandler } from 'express';

export const ipMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let ip = req.get('CF-Connecting-IP') || req.get('X-Forwarded-For') || req.ip;
  ip = Array.isArray(ip) ? ip[0] : ip;
  if (ip?.includes(',')) {
    ip = ip.split(',')[0];
  }

  res.locals.ip = ip;
  next();
};
