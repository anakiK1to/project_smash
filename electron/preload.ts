import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: process.env.npm_package_version ?? 'unknown',
});
