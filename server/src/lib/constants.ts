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
  Owner: 'owner',
  Admin: 'admin',
  Collaborator: 'collaborator',
  Viewer: 'viewer',
};

export const nodeRoleHierarchy = [
  NodeRoles.Owner,
  NodeRoles.Admin,
  NodeRoles.Collaborator,
  NodeRoles.Viewer,
];

export const hasOwnerAccess = (role: string): boolean => {
  return role === NodeRoles.Owner;
};

export const hasAdminAccess = (role: string): boolean => {
  return role === NodeRoles.Owner || role === NodeRoles.Admin;
};

export const hasCollaboratorAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Owner ||
    role === NodeRoles.Admin ||
    role === NodeRoles.Collaborator
  );
};

export const hasViewerAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Owner ||
    role === NodeRoles.Admin ||
    role === NodeRoles.Collaborator ||
    role === NodeRoles.Viewer
  );
};
