import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppContext, handleIpc, type AppContext } from './handlers';
import type { IpcChannel } from '../src/core/ipcSchema';
import { IpcSchema } from '../src/core/ipcSchema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DIST = path.join(__dirname, '../dist');

let win: BrowserWindow | null = null;
let ctx: AppContext | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const isApp =
      url.startsWith('file://') ||
      Boolean(process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL));
    if (!isApp) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  ctx = createAppContext();
  for (const channel of Object.keys(IpcSchema) as IpcChannel[]) {
    ipcMain.handle(channel, async (_event, raw) => {
      if (!ctx) throw new Error('App not ready');
      return handleIpc(ctx, channel, raw);
    });
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
