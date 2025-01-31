import started from 'electron-squirrel-startup';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
import { createDebugger } from '@colanode/core';

import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  shell,
  globalShortcut,
} from 'electron';
import path from 'path';

import { mediator } from '@/main/mediator';
import { getAppIconPath } from '@/main/lib/utils';
import { CommandInput, CommandMap } from '@/shared/commands';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationInput, MutationMap } from '@/shared/mutations';
import { QueryInput, QueryMap } from '@/shared/queries';
import { appService } from '@/main/services/app-service';
import {
  handleAssetRequest,
  handleAvatarRequest,
  handleFilePreviewRequest,
  handleFileRequest,
} from '@/main/lib/protocols';

const debug = createDebugger('desktop:main');

app.setName('Colanode');
app.setAppUserModelId('com.colanode.desktop');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

updateElectronApp({
  updateSource: {
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: 'colanode/colanode',
    host: 'https://update.electronjs.org',
  },
  updateInterval: '10 minutes',
  notifyUser: true,
});

const createWindow = async () => {
  await appService.migrate();

  // Create the browser window.
  let windowSize = (await appService.metadata.get('window_size'))?.value;
  const mainWindow = new BrowserWindow({
    width: windowSize?.width ?? 1200,
    height: windowSize?.height ?? 800,
    fullscreen: windowSize?.fullscreen ?? false,
    fullscreenable: true,
    minWidth: 800,
    minHeight: 600,
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 5, y: 5 },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('resized', () => {
    windowSize = {
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height,
      fullscreen: false,
    };

    appService.metadata.set('window_size', windowSize);
  });

  mainWindow.on('enter-full-screen', () => {
    windowSize = {
      width: windowSize?.width ?? mainWindow.getBounds().width,
      height: windowSize?.height ?? mainWindow.getBounds().height,
      fullscreen: true,
    };

    appService.metadata.set('window_size', windowSize);
  });

  mainWindow.on('leave-full-screen', () => {
    windowSize = {
      width: windowSize?.width ?? mainWindow.getBounds().width,
      height: windowSize?.height ?? mainWindow.getBounds().height,
      fullscreen: false,
    };

    appService.metadata.set('window_size', windowSize);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  const subscriptionId = eventBus.subscribe((event) => {
    if (event.type === 'query_result_updated') {
      mainWindow.webContents.send('event', event);
    }
  });

  if (!protocol.isProtocolHandled('avatar')) {
    protocol.handle('avatar', (request) => {
      return handleAvatarRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file')) {
    protocol.handle('local-file', (request) => {
      return handleFileRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('local-file-preview')) {
    protocol.handle('local-file-preview', (request) => {
      return handleFilePreviewRequest(request);
    });
  }

  if (!protocol.isProtocolHandled('asset')) {
    protocol.handle('asset', (request) => {
      return handleAssetRequest(request);
    });
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' }; // Prevent default new-window behavior
  });

  globalShortcut.register('CommandOrControl+Shift+V', () => {
    mainWindow.webContents.pasteAndMatchStyle();
  });

  mainWindow.on('close', () => {
    eventBus.unsubscribe(subscriptionId);
    globalShortcut.unregister('CommandOrControl+Shift+V');
  });

  debug('Window created');
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

  mediator.clearSubscriptions();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle('init', async () => {
  await appService.init();
});

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
  'execute-command',
  async <T extends CommandInput>(
    _: unknown,
    input: T
  ): Promise<CommandMap[T['type']]['output']> => {
    return mediator.executeCommand(input);
  }
);
