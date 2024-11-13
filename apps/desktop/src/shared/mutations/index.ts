export interface MutationMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];
