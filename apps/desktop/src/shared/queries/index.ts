export interface QueryMap {}

export type QueryInput = QueryMap[keyof QueryMap]['input'];
