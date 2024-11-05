import { Request, Response, NextFunction } from 'express';

export enum ApiError {
  GoogleAuthFailed = 'GoogleAuthFailed',
  UserPendingActivation = 'UserPendingActivation',
  InternalServerError = 'InternalServerError',
  EmailAlreadyExists = 'EmailAlreadyExists',
  EmailOrPasswordIncorrect = 'EmailOrPasswordIncorrect',
  MissingRequiredFields = 'MissingRequiredFields',
  ResourceNotFound = 'ResourceNotFound',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  BadRequest = 'BadRequest',
}

export type NeuronRequestAccount = {
  id: string;
  deviceId: string;
};

export type NeuronRequest = Request & {
  account?: NeuronRequestAccount;
};

export type NeuronResponse = Response;

export type NeuronNextFunction = NextFunction;
