import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { eventBus } from '@/lib/event-bus';
import { MutationInput, MutationMap } from '@/types/mutations';
import { QueryInput, QueryMap } from '@/types/queries';
import { mediator } from '@/electron/mediator';
import { databaseContext } from './electron/database-context';

let subscriptionId: string | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
  await databaseContext.init();

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

ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T,
  ): Promise<MutationMap[T['type']]['output']> => {
    return mediator.handleMutation(input);
  },
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    id: string,
    input: T,
  ): Promise<QueryMap[T['type']]['output']> => {
    return mediator.handleQuery(id, input);
  },
);

ipcMain.handle('unsubscribe-query', (_: unknown, id: string): void => {
  mediator.unsubscribeQuery(id);
});
