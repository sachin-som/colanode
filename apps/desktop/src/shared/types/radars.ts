export type ChannelReadState = {
  type: 'channel';
  nodeId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type ChatReadState = {
  type: 'chat';
  nodeId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type DatabaseReadState = {
  type: 'database';
  nodeId: string;
  unseenRecordsCount: number;
};

export type RecordReadState = {
  type: 'record';
  nodeId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type PageState = {
  type: 'page';
  nodeId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type FolderState = {
  type: 'folder';
  nodeId: string;
  unseenFilesCount: number;
};

export type WorkspaceReadState = {
  importantCount: number;
  hasUnseenChanges: boolean;
  nodeStates: Record<string, ReadState>;
};

export type ReadState =
  | ChannelReadState
  | ChatReadState
  | DatabaseReadState
  | RecordReadState
  | PageState
  | FolderState;
