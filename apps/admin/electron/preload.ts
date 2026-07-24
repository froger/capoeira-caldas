import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('adminApi', {
  invoke: (channel: string, input?: unknown) => ipcRenderer.invoke(channel, input),
});
