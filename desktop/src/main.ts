import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { globalDatabase } from "@/electron/database/global";
import {initEventLoop} from "@/electron/event-loop";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// inter process handlers
ipcMain.handle('init', async () => globalDatabase.init());
ipcMain.handle('get-accounts', async () => globalDatabase.getAccounts());
ipcMain.handle('add-account', async (_, account) => globalDatabase.addAccount(account));
ipcMain.handle('get-workspaces', async () => globalDatabase.getWorkspaces());
ipcMain.handle('add-workspace', async (_, workspace) => globalDatabase.addWorkspace(workspace));
ipcMain.handle('add-transaction', async (_, transaction) => globalDatabase.addTransaction(transaction));

ipcMain.handle('add-node', async (_, accountId, workspaceId, node) => {
  const workspaceDb = globalDatabase.getWorkspaceDatabase(accountId, workspaceId);
  await workspaceDb.addNode(node);
});

ipcMain.handle('add-nodes', async (_, accountId, workspaceId, nodes) => {
  const workspaceDb = globalDatabase.getWorkspaceDatabase(accountId, workspaceId);
  await workspaceDb.addNodes(nodes);
});

ipcMain.handle('get-nodes', async (_, accountId, workspaceId) => {
  const workspaceDb = globalDatabase.getWorkspaceDatabase(accountId, workspaceId);
  return workspaceDb.getNodes();
});

ipcMain.handle('update-node', async (_, accountId, workspaceId, node) => {
  const workspaceDb = globalDatabase.getWorkspaceDatabase(accountId, workspaceId);
  await workspaceDb.updateNode(node);
});

ipcMain.handle('delete-node', async (_, accountId, workspaceId, nodeId) => {
  const workspaceDb = globalDatabase.getWorkspaceDatabase(accountId, workspaceId);
  await workspaceDb.deleteNode(nodeId);
});

initEventLoop();