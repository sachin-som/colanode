import { monotonicFactory } from 'ulid'

const ulid = monotonicFactory()

export function generateId(type: IdType) {
    return ulid().toLowerCase() + type
}

export enum IdType {
  Account = 'ac',
}