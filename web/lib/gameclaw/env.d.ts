import type { DesktopConfig, DesktopInfo, OpenPathResult, UpdateStatus } from "./types";

export {};

declare global {
  interface Window {
    clawcraftDesktop?: {
      desktop: boolean;
      platform: string;
      getInfo: () => Promise<DesktopInfo>;
      getConfig: () => Promise<DesktopConfig>;
      saveConfig: (config: DesktopConfig) => Promise<DesktopConfig>;
      getLogs: () => Promise<string>;
      openPath: (targetPath: string) => Promise<OpenPathResult>;
      checkForUpdates: () => Promise<UpdateStatus>;
    };
  }
}
