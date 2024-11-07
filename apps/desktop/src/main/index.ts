import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  dialog,
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { eventBus } from '@/lib/event-bus';
import { databaseManager } from '@/main/data/database-manager';
import { socketManager } from '@/main/sockets/socket-manager';
import { synchronizer } from '@/main/synchronizer';
import { avatarManager } from '@/main/avatar-manager';
import { fileManager } from '@/main/file-manager';
import { mediator } from '@/main/mediator';
import { FileMetadata } from '@/types/files';
import { MutationInput, MutationMap } from '@/operations/mutations';
import { QueryInput, QueryMap } from '@/operations/queries';

let subscriptionId: string | null = null;
const icon = join(__dirname, '../assets/icon.png');

const createWindow = async (): Promise<void> => {
  await databaseManager.init();
  socketManager.init();
  synchronizer.init();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const electronRendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (is.dev && electronRendererUrl) {
    mainWindow.loadURL(electronRendererUrl);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  if (subscriptionId === null) {
    subscriptionId = eventBus.subscribe((event) => {
      mainWindow.webContents.send('event', event);
    });
  }

  if (!protocol.isProtocolHandled('avatar')) {
    protocol.handle('avatar', (request) => {
      return avatarManager.handleAvatarRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file')) {
    protocol.handle('local-file', (request) => {
      return fileManager.handleFileRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file-preview')) {
    protocol.handle('local-file-preview', (request) => {
      return fileManager.handleFilePreviewRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('asset')) {
    protocol.handle('asset', (request) => {
      const url = request.url.replace('asset://', '');
      const filePath = join(__dirname, 'assets', url);
      const localFileUrl = `file://${filePath}`;
      return net.fetch(localFileUrl);
    });
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (subscriptionId) {
    eventBus.unsubscribe(subscriptionId);
    subscriptionId = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle(
  'execute-mutation',
  async <T extends MutationInput>(
    _: unknown,
    input: T
  ): Promise<MutationMap[T['type']]['output']> => {
    return mediator.executeMutation(input);
  }
);

ipcMain.handle(
  'execute-query',
  async <T extends QueryInput>(
    _: unknown,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return mediator.executeQuery(input);
  }
);

ipcMain.handle(
  'execute-query-and-subscribe',
  async <T extends QueryInput>(
    _: unknown,
    id: string,
    input: T
  ): Promise<QueryMap[T['type']]['output']> => {
    return mediator.executeQueryAndSubscribe(id, input);
  }
);

ipcMain.handle('unsubscribe-query', (_: unknown, id: string): void => {
  mediator.unsubscribeQuery(id);
});

ipcMain.handle(
  'open-file-dialog',
  async (
    _: unknown,
    options: Electron.OpenDialogOptions
  ): Promise<Electron.OpenDialogReturnValue> => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No focused window');
    }

    return dialog.showOpenDialog(window, options);
  }
);

ipcMain.handle(
  'get-file-metadata',
  (_: unknown, path: string): FileMetadata | null => {
    return fileManager.getFileMetadata(path);
  }
);

ipcMain.handle(
  'open-file',
  async (
    _: unknown,
    userId: string,
    id: string,
    extension: string
  ): Promise<void> => {
    return fileManager.openFile(userId, id, extension);
  }
);
