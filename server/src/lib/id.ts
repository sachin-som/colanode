import { monotonicFactory } from 'ulid'

const ulid = monotonicFactory()

export const generateId = (type: IdType) => {
    return ulid().toLowerCase() + type
}

export enum IdType {
  Account = 'ac',
  Workspace = 'wc',
  User = 'us',
  Version = 've'
}