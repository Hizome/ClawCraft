import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, shell } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const DEFAULT_CONFIG = {
  gatewayUrl: "ws://127.0.0.1:18789",
  token: "",
  password: "",
  sessionKey: "main",
  assetDirectory: ""
};

let logFilePath = "";
let configFilePath = "";
let resourceDirectory = "";

function createWindow() {
  const iconPath = path.join(__dirname, "..", "build", "icon.png");

  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    title: "WarClaw",
    icon: iconPath,
    backgroundColor: "#0b121c",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void win.loadURL("http://127.0.0.1:3000");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    void win.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  return win;
}

async function ensureRuntimePaths() {
  const userDataDir = app.getPath("userData");
  resourceDirectory = path.join(userDataDir, "resources");
  const logDirectory = path.join(userDataDir, "logs");
  configFilePath = path.join(userDataDir, "warclaw-config.json");
  logFilePath = path.join(logDirectory, "desktop.log");

  await fs.mkdir(resourceDirectory, { recursive: true });
  await fs.mkdir(logDirectory, { recursive: true });
}

async function readConfig() {
  try {
    const raw = await fs.readFile(configFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      assetDirectory: parsed.assetDirectory || resourceDirectory
    };
  } catch {
    const next = {
      ...DEFAULT_CONFIG,
      assetDirectory: resourceDirectory
    };
    await writeConfig(next);
    return next;
  }
}

async function writeConfig(config) {
  const next = {
    ...DEFAULT_CONFIG,
    ...config,
    assetDirectory: config.assetDirectory || resourceDirectory
  };
  await fs.writeFile(configFilePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  await appendLog(`config.saved gateway=${next.gatewayUrl} session=${next.sessionKey}`);
  return next;
}

async function appendLog(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.appendFile(logFilePath, line, "utf8");
}

async function readRecentLogs(limit = 80) {
  try {
    const raw = await fs.readFile(logFilePath, "utf8");
    return raw.trim().split("\n").slice(-limit).join("\n");
  } catch {
    return "";
  }
}

function getDesktopInfo() {
  return {
    desktop: true,
    platform: process.platform,
    version: app.getVersion(),
    paths: {
      userData: app.getPath("userData"),
      resources: resourceDirectory,
      logs: logFilePath,
      config: configFilePath
    }
  };
}

async function getUpdateStatus() {
  return {
    supported: false,
    state: "not_configured",
    message: "Auto-update is scaffolded in the desktop API but no update feed is configured yet."
  };
}

function registerIpc() {
  ipcMain.handle("desktop:get-info", async () => {
    await appendLog("desktop.info.requested");
    return getDesktopInfo();
  });

  ipcMain.handle("desktop:get-config", async () => {
    const config = await readConfig();
    await appendLog("desktop.config.requested");
    return config;
  });

  ipcMain.handle("desktop:save-config", async (_event, config) => {
    return writeConfig(config);
  });

  ipcMain.handle("desktop:get-logs", async () => {
    await appendLog("desktop.logs.requested");
    return readRecentLogs();
  });

  ipcMain.handle("desktop:open-path", async (_event, targetPath) => {
    const result = await shell.openPath(targetPath);
    if (result) {
      await appendLog(`desktop.open-path.failed path=${targetPath} reason=${result}`);
      return { ok: false, error: result };
    }
    await appendLog(`desktop.open-path.ok path=${targetPath}`);
    return { ok: true };
  });

  ipcMain.handle("desktop:check-updates", async () => {
    await appendLog("desktop.updates.requested");
    return getUpdateStatus();
  });
}

app.whenReady().then(async () => {
  await ensureRuntimePaths();
  await appendLog("app.ready");
  registerIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  await appendLog("app.window-all-closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});
