import {app, ipcMain} from "electron";
import database from 'better-sqlite3';
import {Workspace} from "@/types/workspaces";

const path = app.getPath('userData');
const globalDb = new database(`${path}/global.db`);

export function initGlobalDb() {
  const createWorkspacesTable = `
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL,
    created_at DATE NOT NULL
  );
`;

  globalDb.exec(createWorkspacesTable);
}

export function getWorkspaces(): Workspace[] {
  const stmt = globalDb.prepare<[], Workspace>('SELECT id, name, avatar, role FROM workspaces');
  return  stmt.all();
}

export function addWorkspace(workspace: Workspace) {
  const stmt = globalDb.prepare('INSERT INTO workspaces (id, name, avatar, role, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(workspace.id, workspace.name, workspace.avatar, workspace.role, new Date().toISOString());
}

export function defineGlobalDbHandlers() {
  ipcMain.handle('get-workspaces', () => getWorkspaces());
  ipcMain.handle('add-workspace', (event, workspace: Workspace) => addWorkspace(workspace));
}