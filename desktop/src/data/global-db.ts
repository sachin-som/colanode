import {app, ipcMain} from "electron";
import database from 'better-sqlite3';
import {Workspace} from "@/types/workspaces";

const path = app.getPath('userData');
const globalDb = new database(`${path}/global.db`);

const createWorkspacesTableQuery = `
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    version_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    role INTEGER NOT NULL,
    user_node_id TEXT NOT NULL
  );
`;

const selectWorkspacesQuery = `
  SELECT 
    id, 
    name, 
    description, 
    avatar,
    version_id as versionId,
    account_id as accountId,
    role, 
    user_node_id as userNodeId
  FROM workspaces
`;

const insertWorkspaceQuery = `
  INSERT INTO workspaces 
  (
    id, 
    name, 
    description, 
    avatar, 
    version_id, 
    account_id, 
    role, 
    user_node_id
  ) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

function getWorkspaces(): Workspace[] {
  const stmt = globalDb.prepare<[], Workspace>(selectWorkspacesQuery);
  return stmt.all();
}

function addWorkspace(workspace: Workspace) {
  const stmt = globalDb.prepare(insertWorkspaceQuery);
  console.log('workspace', workspace);
  stmt.run(workspace.id, workspace.name, workspace.description, workspace.avatar, workspace.versionId, workspace.accountId, workspace.role, workspace.userNodeId);
}

export function initGlobalDb() {
  globalDb.exec(createWorkspacesTableQuery);
}

export function defineGlobalDbHandlers() {
  ipcMain.handle('get-workspaces', () => getWorkspaces());
  ipcMain.handle('add-workspace', (event, workspace: Workspace) => addWorkspace(workspace));
}