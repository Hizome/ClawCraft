# OpenClaw：GUI 面板与外部渠道（Telegram）控制链路分析

本文件基于仓库源码梳理 OpenClaw 的两条关键链路：
1. **GUI 对话面板（Control UI）如何控制 agent**
2. **Telegram 等外部社交软件如何与 agent 通信**

以下内容聚焦“真正的调用链”，并给出关键模块与角色的责任边界。

---

## 1. Control UI（GUI 对话面板）→ Gateway → Agent 的调用链

### 1.1 静态资源与启动配置

- Control UI 是独立前端工程：`ui/`。
- 构建输出到 `dist/control-ui`，由 Gateway 负责静态托管。
- UI 启动时会拉取一个 bootstrap 配置，包含默认 assistant 信息。

关键入口：
- `ui/vite.config.ts`（构建输出路径）
- `src/infra/control-ui-assets.ts`（定位 Control UI 资源）
- `src/gateway/control-ui.ts`（HTTP 处理、静态资源、CSP）
- `src/gateway/control-ui-contract.ts`（`/__openclaw/control-ui-config.json`）
- `ui/src/ui/controllers/control-ui-bootstrap.ts`（UI 读取 bootstrap）

### 1.2 UI 与 Gateway 连接建立（WebSocket）

**浏览器端**：
- `GatewayBrowserClient` 负责建立 WS 连接并完成 `connect` 请求。
- 连接时带上 token/password/device identity（HTTPS 下强制）。

关键入口：
- `ui/src/ui/gateway.ts`（WS 连接 + 认证）
- `ui/src/ui/app-gateway.ts`（连接生命周期 + UI 状态驱动）

**服务端**：
- WS 握手统一入口在 `src/gateway/server/ws-connection/message-handler.ts`。
- 握手阶段：
  - 校验 token/password
  - 设备身份 / pairing（Control UI 要求 device identity）
  - 角色/权限/来源验证
- 校验通过后进入通用的 `handleGatewayRequest`。

关键入口：
- `src/gateway/server/ws-connection/message-handler.ts`
- `src/gateway/server-methods.ts`

### 1.3 UI 发起“对话/工具调用”

**UI 侧调用**：
- UI 输入后调用 `chat.send`，同时也会拉取 `chat.history`。
- UI 维护 `chatRunId`、流式片段与工具调用展示。

关键入口：
- `ui/src/ui/controllers/chat.ts`
- `ui/src/ui/app-tool-stream.ts`

**Gateway 侧处理**：
- `chat.send` 处理逻辑在 `src/gateway/server-methods/chat.ts`。
- 核心：
  1. 校验 message、attachments
  2. 解析 sessionKey
  3. 调用 `dispatchInboundMessage` 进入 agent 回复管线

关键入口：
- `src/gateway/server-methods/chat.ts`
- `src/auto-reply/dispatch.ts`

### 1.4 Agent 回复回到 UI

- 回复流通过 gateway 的事件系统回推到 UI（`event` 帧）。
- UI 侧处理增量/最终消息，更新对话面板与工具流。

关键入口：
- `ui/src/ui/app-gateway.ts`
- `ui/src/ui/controllers/chat.ts`
- `src/gateway/server-methods.ts`（事件汇总与分发）

---

## 2. Telegram（外部社交软件）→ Gateway → Agent 的调用链

### 2.1 频道插件注册

- Telegram 是一个 **Channel Plugin**：`extensions/telegram`。
- 注册时：
  - 注入 channel plugin
  - 注入 runtime（供插件调用内部实现）

关键入口：
- `extensions/telegram/index.ts`
- `extensions/telegram/src/channel.ts`
- `extensions/telegram/src/runtime.ts`

### 2.2 Gateway 启动频道账号

- Gateway 启动时会扫描 channel plugins 并启动 account。
- `ChannelManager` 调用 `plugin.gateway.startAccount`。

关键入口：
- `src/gateway/server-channels.ts`
- `extensions/telegram/src/channel.ts`（`gateway.startAccount`）

### 2.3 Telegram 连接模式：Polling / Webhook

**Polling 模式**：
- `monitorTelegramProvider` 创建 `TelegramPollingSession`。
- 通过 grammY `getUpdates` 长轮询。

**Webhook 模式**：
- `startTelegramWebhook` 启动 HTTP server。
- Telegram POST 到 `webhookPath`（默认 `/telegram-webhook`）。

关键入口：
- `src/telegram/monitor.ts`
- `src/telegram/webhook.ts`

### 2.4 Telegram 消息 → Agent 回复

**消息接收**：
- grammY 的 bot 接收消息，进入 `bot-handlers`、`bot-message` 解析。
- 构造 `TelegramMessageContext`，交给 `dispatchTelegramMessage`。

**回复分发**：
- `dispatchTelegramMessage` 进入通用 `auto-reply` 体系。
- 处理：上下文、模型选择、分块、推理流、媒体处理。
- 最终发送 Telegram reply。

关键入口：
- `src/telegram/bot.ts`
- `src/telegram/bot-message-dispatch.ts`
- `src/auto-reply/dispatch.ts`

---

## 3. 更细粒度的关键调用链（从 UI 发起到 Telegram 返回）

### A. Control UI → Agent

1. 用户在 UI 输入 → `ui/src/ui/controllers/chat.ts:sendChatMessage`
2. 通过 `GatewayBrowserClient` 发送 `chat.send`
3. Gateway → `src/gateway/server-methods/chat.ts`
4. `dispatchInboundMessage` → `src/auto-reply/dispatch.ts`
5. Agent 产生回复 → 事件回推
6. UI 收到事件 → UI 更新对话

### B. Telegram → Agent

1. Telegram Bot 收到消息（Polling/Webhook）
2. grammY handler → `src/telegram/bot-message.ts`
3. `dispatchTelegramMessage` → `src/telegram/bot-message-dispatch.ts`
4. `auto-reply` 管线 → 生成回复
5. `sendTelegramPayloadMessages` 发送消息

---

## 4. 关键边界与职责

- **Control UI 是纯前端**：不直接控制 agent，所有操作通过 Gateway WS 协议。
- **Gateway 是权威控制面**：负责认证、权限、路由与 session。
- **Channel Plugins 是渠道适配层**：处理接入与消息格式转换。
- **Agent 逻辑集中在 auto-reply 与 model pipeline**。

---

如果你需要“更精确的函数级调用链图”，可以指定：
- 具体渠道（Telegram/Discord/Slack）
- 具体 UI 操作（send / tool call / exec approval）
我可以继续补充。
