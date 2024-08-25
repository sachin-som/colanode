import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

enum IdType {
  Account = 'ac',
  Workspace = 'wc',
  User = 'us',
  Version = 've',
  Mutation = 'mu',
  Space = 'sp',
  Page = 'pg',
  Channel = 'ch',
  Node = 'nd',
  Message = 'ms',
  Device = 'dv',
  Update = 'up',
}

export class NeuronId {
  public static generate(type: IdType): string {
    return ulid().toLowerCase() + type;
  }

  public static is(id: string, type: IdType): boolean {
    return id.endsWith(type);
  }

  public static getType(id: string): IdType {
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
      case 'mutation':
        return IdType.Mutation;
      case 'space':
        return IdType.Space;
      case 'page':
        return IdType.Page;
      case 'channel':
        return IdType.Channel;
      case 'message':
        return IdType.Message;
      case 'device':
        return IdType.Device;
      case 'update':
        return IdType.Update;
      default:
        return IdType.Node;
    }
  }

  public static Type = IdType;
}
