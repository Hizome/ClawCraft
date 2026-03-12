export type DesktopInfo = {
  desktop: boolean;
  platform: string;
  version: string;
  paths: {
    userData: string;
    resources: string;
    logs: string;
    config: string;
  };
};

export type DesktopConfig = {
  gatewayUrl: string;
  token: string;
  password: string;
  sessionKey: string;
  assetDirectory: string;
};

export type UpdateStatus = {
  supported: boolean;
  state: string;
  message: string;
};

export type OpenPathResult = {
  ok: boolean;
  error?: string;
};

export type ChatEventPayload = {
  state?: string;
  message?: any;
  runId?: string;
};

export type ChatBubble = {
  id: string;
  speaker: "you" | "agent";
  text: string;
  draft?: boolean;
};
