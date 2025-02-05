export * from './nodes';
export * from './users';
export * from './files';
export * from './node-reactions';
export * from './node-interactions';
export * from './node-tombstones';
export * from './collaborations';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SynchronizerMap {}

export type SynchronizerInput = SynchronizerMap[keyof SynchronizerMap]['input'];
