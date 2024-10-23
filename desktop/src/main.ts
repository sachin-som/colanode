import { app, ipcMain, BrowserWindow, protocol, dialog } from 'electron';
import path from 'path';
import { eventBus } from '@/lib/event-bus';
import { MutationInput, MutationMap } from '@/operations/mutations';
import { QueryInput, QueryMap } from '@/operations/queries';
import { mediator } from '@/main/mediator';
import { databaseManager } from '@/main/data/database-manager';
import { socketManager } from '@/main/sockets/socket-manager';
import { synchronizer } from '@/main/synchronizer';
import { avatarManager } from '@/main/avatar-manager';
import { fileManager } from '@/main/file-manager';

let subscriptionId: string | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
  await databaseManager.init();
  socketManager.init();
  synchronizer.init();

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

  protocol.handle('avatar', (request) => {
    return avatarManager.handleAvatarRequest(request);
  });

  protocol.handle('local-file', (request) => {
    return fileManager.handleFileRequest(request);
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

ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T,
  ): Promise<MutationMap[T['type']]['output']> => {
    return mediator.executeMutation(input);
  },
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    input: T,
  ): Promise<QueryMap[T['type']]['output']> => {
    return mediator.executeQuery(input);
  },
);

ipcMain.handle(
  'execute-query-and-subscribe',
  async <T extends QueryInput>(
    _: unknown,
    id: string,
    input: T,
  ): Promise<QueryMap[T['type']]['output']> => {
    return mediator.executeQueryAndSubscribe(id, input);
  },
);

ipcMain.handle('unsubscribe-query', (_: unknown, id: string): void => {
  mediator.unsubscribeQuery(id);
});

ipcMain.handle(
  'open-file-dialog',
  async (
    _: unknown,
    options: Electron.OpenDialogOptions,
  ): Promise<Electron.OpenDialogReturnValue> => {
    return dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options);
  },
);
