import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("warclawDesktop", {
  desktop: true,
  platform: process.platform,
  getInfo: () => ipcRenderer.invoke("desktop:get-info"),
  getConfig: () => ipcRenderer.invoke("desktop:get-config"),
  saveConfig: (config) => ipcRenderer.invoke("desktop:save-config", config),
  getLogs: () => ipcRenderer.invoke("desktop:get-logs"),
  openPath: (targetPath) => ipcRenderer.invoke("desktop:open-path", targetPath),
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-updates")
});
