import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

enum IdType {
  Account = 'ac',
  Workspace = 'wc',
  User = 'us',
  Version = 've',
  Transaction = 'tr',
  Space = 'sp',
  Page = 'pg',
  Channel = 'ch',
  Node = 'nd',
  Message = 'ms',
}

export class NeuronId {
  public static generate(type: IdType): string {
    return ulid().toLowerCase() + type;
  }

  public static is(id: string, type: IdType): boolean {
    return id.endsWith(type);
  }

  public static getNodeTypeFromId(id: string): IdType {
    return id.substring(id.length - 2) as IdType;
  }

  public static getIdTypeFromNode(nodeType: string): IdType {
    switch (nodeType) {
      case 'account':
        return IdType.Account;
      case 'workspace':
        return IdType.Workspace;
      case 'user':
        return IdType.User;
      case 'version':
        return IdType.Version;
      case 'transaction':
        return IdType.Transaction;
      case 'space':
        return IdType.Space;
      case 'page':
        return IdType.Page;
      case 'channel':
        return IdType.Channel;
      default:
        return IdType.Node;
    }
  }

  public static Type = IdType;
}
