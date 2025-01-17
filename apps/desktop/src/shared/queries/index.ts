// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QueryMap {}

export type QueryInput = QueryMap[keyof QueryMap]['input'];

export class QueryError extends Error {
  constructor(
    public code: QueryErrorCode,
    message: string
  ) {
    super(message);
  }
}

export enum QueryErrorCode {
  Unknown = 'unknown',
  AccountNotFound = 'account_not_found',
  WorkspaceNotFound = 'workspace_not_found',
}
