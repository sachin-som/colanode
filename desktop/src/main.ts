import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { eventBus } from '@/lib/event-bus';
import { appManager } from '@/data/app-manager';
import { CompiledQuery, QueryResult } from 'kysely';
import { SubscribedQueryContext } from './types/databases';

let subscriptionId: string | null = null;

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
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  subscriptionId = eventBus.subscribe((event) => {
    mainWindow.webContents.send('event', event);
  });
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

app.on('before-quit', () => {
  if (subscriptionId) {
    eventBus.unsubscribe(subscriptionId);
  }
});

// inter process handlers
ipcMain.handle('init', async () => appManager.init());
ipcMain.handle('logout', async (_, accountId) => appManager.logout(accountId));

ipcMain.handle(
  'execute-app-mutation',
  async (_, mutation: CompiledQuery): Promise<void> => {
    await appManager.executeMutation(mutation);
  },
);

ipcMain.handle(
  'execute-app-query',
  async (_, query: CompiledQuery<unknown>): Promise<QueryResult<unknown>> => {
    return await appManager.executeQuery(query);
  },
);

ipcMain.handle(
  'execute-app-query-and-subscribe',
  async (
    _,
    context: SubscribedQueryContext<unknown>,
  ): Promise<QueryResult<unknown>> => {
    return await appManager.executeQueryAndSubscribe(context);
  },
);

ipcMain.handle('unsubscribe-app-query', (_, queryKey: string[]): void => {
  appManager.unsubscribeQuery(queryKey);
});

ipcMain.handle(
  'execute-workspace-mutation',
  async (
    _,
    accountId: string,
    workspaceId: string,
    mutation: CompiledQuery | CompiledQuery[],
  ): Promise<void> => {
    const accountManager = await appManager.getAccount(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const workspaceManager = accountManager.getWorkspace(workspaceId);
    if (!workspaceManager) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    return await workspaceManager.executeMutation(mutation);
  },
);

ipcMain.handle(
  'execute-workspace-query',
  async (
    _,
    accountId: string,
    workspaceId: string,
    query: CompiledQuery<unknown>,
  ): Promise<QueryResult<unknown>> => {
    const accountManager = await appManager.getAccount(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const workspaceManager = accountManager.getWorkspace(workspaceId);
    if (!workspaceManager) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    return await workspaceManager.executeQuery(query);
  },
);

ipcMain.handle(
  'execute-workspace-query-and-subscribe',
  async (
    _,
    accountId: string,
    workspaceId: string,
    context: SubscribedQueryContext<unknown>,
  ): Promise<QueryResult<unknown>> => {
    const accountManager = await appManager.getAccount(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const workspaceManager = accountManager.getWorkspace(workspaceId);
    if (!workspaceManager) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    return await workspaceManager.executeQueryAndSubscribe(context);
  },
);

ipcMain.handle(
  'unsubscribe-workspace-query',
  async (
    _,
    accountId: string,
    workspaceId: string,
    queryKey: string[],
  ): Promise<void> => {
    const accountManager = await appManager.getAccount(accountId);
    if (!accountManager) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const workspaceManager = accountManager.getWorkspace(workspaceId);
    if (!workspaceManager) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    workspaceManager.unsubscribeQuery(queryKey);
  },
);
