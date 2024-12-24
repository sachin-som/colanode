export type ChannelReadState = {
  type: 'channel';
  channelId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type ChatReadState = {
  type: 'chat';
  chatId: string;
  unseenMessagesCount: number;
  mentionsCount: number;
};

export type DatabaseReadState = {
  type: 'database';
  databaseId: string;
  unseenRecordsCount: number;
};

export type RecordReadState = {
  type: 'record';
  recordId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type PageState = {
  type: 'page';
  pageId: string;
  hasUnseenChanges: boolean;
  mentionsCount: number;
};

export type FolderState = {
  type: 'folder';
  folderId: string;
  unseenFilesCount: number;
};

export type WorkspaceReadState = {
  importantCount: number;
  hasUnseenChanges: boolean;
};

export type AccountReadState = {
  importantCount: number;
  hasUnseenChanges: boolean;
};

export type WorkspaceRadarData = WorkspaceReadState & {
  userId: string;
  workspaceId: string;
  accountId: string;
  nodeStates: Record<string, NodeReadState>;
};

export type NodeReadState =
  | ChannelReadState
  | ChatReadState
  | DatabaseReadState
  | RecordReadState
  | PageState
  | FolderState;
