export const NodeTypes = {
  User: 'user',
  Space: 'space',
  Page: 'page',
  Channel: 'channel',
  Chat: 'chat',
  Message: 'message',
  Database: 'database',
  DatabaseReplica: 'database_replica',
  Record: 'record',
  Folder: 'folder',
  TableView: 'table_view',
  BoardView: 'board_view',
  CalendarView: 'calendar_view',
  Field: 'field',
  SelectOption: 'select_option',
  File: 'file',
};

export const NodeRoles = {
  Admin: 'admin',
  Editor: 'editor',
  Collaborator: 'collaborator',
  Viewer: 'viewer',
};

export const hasAdminAccess = (role: string): boolean => {
  return role === NodeRoles.Admin;
};

export const hasEditorAccess = (role: string): boolean => {
  return role === NodeRoles.Admin || role === NodeRoles.Editor;
};

export const hasCollaboratorAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Admin ||
    role === NodeRoles.Editor ||
    role === NodeRoles.Collaborator
  );
};

export const hasViewerAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Admin ||
    role === NodeRoles.Editor ||
    role === NodeRoles.Collaborator ||
    role === NodeRoles.Viewer
  );
};
