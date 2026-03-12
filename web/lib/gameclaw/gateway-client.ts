export type GatewayEventHandler = (name: string, payload: unknown) => void;
export type StatusHandler = (message: string) => void;
export type ResponseHandler = (id: string, ok: boolean, payload?: unknown, err?: unknown) => void;

export type GatewayConnectionOptions = {
  url: string;
  token?: string;
  password?: string;
};

export class GatewayClient {
  private ws: WebSocket | null = null;
  private reqId = 0;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  private eventHandlers: GatewayEventHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private responseHandlers: ResponseHandler[] = [];

  constructor(private opts: GatewayConnectionOptions) {}

  onEvent(handler: GatewayEventHandler) {
    this.eventHandlers.push(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
  }

  onResponse(handler: ResponseHandler) {
    this.responseHandlers.push(handler);
  }

  setConnectionOptions(next: GatewayConnectionOptions) {
    this.opts = next;
  }

  connect() {
    if (this.ws) {
      this.ws.close();
    }
    this.emitStatus(`Gateway: connecting to ${this.opts.url}`);
    this.ws = new WebSocket(this.opts.url);
    this.ws.addEventListener("open", () => {
      this.emitStatus("Gateway: connected (sending connect)");
      this.sendConnect();
    });
    this.ws.addEventListener("close", () => {
      this.emitStatus("Gateway: disconnected");
    });
    this.ws.addEventListener("message", (ev) => {
      this.handleMessage(String(ev.data ?? ""));
    });
    this.ws.addEventListener("error", () => {
      this.emitStatus("Gateway: error");
    });
  }

  request(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId();
    const payload = { type: "req", id, method, params };
    this.ws?.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  sendChat(sessionKey: string, message: string) {
    const idempotencyKey = this.generateIdempotencyKey();
    return this.request("chat.send", {
      sessionKey,
      message,
      idempotencyKey
    });
  }

  private sendConnect() {
    const id = this.nextId();
    const payload = {
      type: "req",
      id,
      method: "connect",
      params: {
        auth: {
          token: this.opts.token || undefined,
          password: this.opts.password || undefined
        },
        client: {
          id: "clawcraft-web",
          mode: "world"
        }
      }
    };
    this.ws?.send(JSON.stringify(payload));
  }

  private handleMessage(text: string) {
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    if (data?.type === "event") {
      for (const handler of this.eventHandlers) handler(data.event, data.payload);
      return;
    }
    if (data?.type === "res") {
      for (const handler of this.responseHandlers) {
        handler(String(data.id), Boolean(data.ok), data.payload, data.error);
      }
      const pending = this.pending.get(String(data.id));
      if (!pending) return;
      this.pending.delete(String(data.id));
      if (data.ok) {
        pending.resolve(data.payload);
      } else {
        pending.reject(data.error);
      }
    }
  }

  private emitStatus(message: string) {
    for (const handler of this.statusHandlers) handler(message);
  }

  private nextId() {
    this.reqId += 1;
    return String(this.reqId);
  }

  private generateIdempotencyKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${this.nextId()}`;
  }
}
