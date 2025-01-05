import { Response } from 'express';
import { ApiErrorOutput } from '@colanode/core';

export class ResponseBuilder {
  static error(res: Response, status: number, error: ApiErrorOutput): void {
    res.status(status).json(error);
  }

  static notFound(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 404, error);
  }

  static badRequest(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 400, error);
  }

  static unauthorized(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 401, error);
  }

  static forbidden(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 403, error);
  }

  static internalError(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 500, error);
  }

  static tooManyRequests(res: Response, error: ApiErrorOutput): void {
    ResponseBuilder.error(res, 429, error);
  }

  static success<T>(res: Response, data: T): void {
    res.status(200).json(data);
  }
}
