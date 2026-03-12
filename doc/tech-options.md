# WarClaw：跨端 2D 游戏式 OpenClaw 前端 — 扩展方案与接口参考

目标：用“任天堂 2D 游戏”的交互方式替代 Telegram/系统 GUI，作为 OpenClaw 的主要操控前端。该前端需跨端（桌面/移动/网页/TV 可选），并与 OpenClaw Gateway 通信，完成对话、工具调用、会话管理与状态监控。

本文扩展多套可落地方案，并整理**OpenClaw 接口/连接方式/事件流**作为实现参考。

---

## 1. 方案总览（扩展版）

### 方案 A：Web 优先（Canvas/WebGL + Gateway WS）

**核心思路**
- Web 端实现 2D 游戏 UI（Phaser/Pixi/Canvas），直接连接 Gateway WS。
- 桌面端通过 Tauri/Electron 打包；移动端 PWA 或 Capacitor。

**适合场景**
- 快速落地
- 需要高频迭代、可热更新

**关键实现点**
- 复用 Gateway WebSocket 协议（对齐 Control UI）。
- HTTPS/localhost 才能启用 device identity（Control UI 的安全要求）。

**优势/风险**
- 优势：成本低，生态成熟。
- 风险：浏览器安全上下文与权限限制，需要处理 token/password/配对。

---

### 方案 B：原生游戏引擎（Godot/Unity）

**核心思路**
- 引擎负责所有渲染与输入，内部实现 Gateway WS 协议。
- 可导出桌面/移动/主机/TV。

**适合场景**
- 强游戏化表现（地图、角色、动画）
- 想要统一 UX 与稳定帧率

**关键实现点**
- 完整实现 Gateway 协议（connect/auth/events/methods）。
- 需要处理 JSON 协议、重连、backoff、event seq。

**优势/风险**
- 优势：表现力极强、交互自由。
- 风险：协议移植与运维成本高；包体大。

---

### 方案 C：Hybrid WebView（嵌入 Web 游戏）

**核心思路**
- UI 仍是 Web Canvas 游戏，但运行在原生 WebView。宿主负责系统能力。

**适合场景**
- 希望兼容系统能力（通知、文件）但保持 Web 开发效率。

**关键实现点**
- WebView 网络策略、证书与 WebSocket 支持。

**优势/风险**
- 优势：更接近原生，仍保留 Web 生态。
- 风险：WebView 性能差异大，调试成本高。

---

### 方案 D：本地代理（WarClaw Gateway Proxy）

**核心思路**
- 本地轻量 Proxy 负责与 OpenClaw Gateway 连接与认证。
- WarClaw 客户端只连 Proxy（简化协议）。

**适合场景**
- 大量客户端设备接入
- 需要统一安全策略或额外协议转换

**关键实现点**
- Proxy 维护 Gateway 连接、缓存状态、转发事件。

**优势/风险**
- 优势：客户端简化，协议迭代风险低。
- 风险：部署复杂度上升，多一层故障点。

---

### 方案 E：在 Control UI 内部做“游戏模式”

**核心思路**
- 在现有 Control UI 基础上实现 “Game Mode”。
- 复用当前 UI 的数据层、授权、配对与工具流。

**适合场景**
- 最低风险的快速验证

**关键实现点**
- UI 架构内扩展 view/renderer，把交互风格变成 2D 游戏。

**优势/风险**
- 优势：协议与权限零改动，最稳定。
- 风险：受限于当前 UI 架构，游戏交互可能打折。

---

## 2. OpenClaw 连接方式与接口参考（关键必读）

下面整理 OpenClaw 控制面（Gateway）的实际连接方式与调用路径，作为 WarClaw 实现参考。

### 2.1 静态资源 & Bootstrap

- Control UI 静态资源由 Gateway 托管，WarClaw 如使用 Web 方案可复用。
- UI 启动时读取 `/_ _openclaw/control-ui-config.json` 获取助手身份与版本。

参考实现：
- `src/gateway/control-ui.ts`
- `src/gateway/control-ui-contract.ts`
- `ui/src/ui/controllers/control-ui-bootstrap.ts`

### 2.2 WebSocket 连接与认证

**浏览器端流程**（Control UI 的实现）：
1. 建立 WS 连接（`GatewayBrowserClient`）。
2. 发送 `connect` 帧，携带：
   - token / password
   - 设备身份签名（HTTPS/localhost 才能启用）
3. 通过后进入事件流 + 方法调用。

参考实现：
- `ui/src/ui/gateway.ts`
- `ui/src/ui/app-gateway.ts`

**服务端校验**：
- 握手在 `src/gateway/server/ws-connection/message-handler.ts`。
- 核心检查：
  - token/password
  - device identity / pairing
  - origin/security policy

参考实现：
- `src/gateway/server/ws-connection/message-handler.ts`
- `src/gateway/auth.ts`

### 2.3 Gateway 方法（Method）调用

Gateway 所有 RPC 方法经 `handleGatewayRequest` 统一分发。

参考实现：
- `src/gateway/server-methods.ts`

**常用方法**：
- `chat.send`：发送用户消息 → agent 回复
- `chat.history`：拉取历史对话
- `sessions.list` / `sessions.delete`
- `tools.catalog`：获取可用工具
- `exec.approvals`：外部执行审批

参考实现：
- `src/gateway/server-methods/chat.ts`
- `src/gateway/server-methods/sessions.ts`
- `src/gateway/server-methods/tools-catalog.ts`
- `src/gateway/server-methods/exec-approvals.ts`

### 2.4 Gateway 事件流

连接后会收到事件帧：
- `chat` 事件：流式增量/完成消息
- `agent` 事件：agent 状态/工具调用
- `update` 事件：更新提醒

参考实现：
- `ui/src/ui/app-gateway.ts`
- `ui/src/ui/controllers/chat.ts`
- `src/gateway/events.ts`

---

## 3. 外部渠道（Telegram）连接方式参考

WarClaw 若作为替代 UI，可不依赖 Telegram，但理解其链路对设计交互有帮助。

### 3.1 插件注册

Telegram 是 channel plugin：
- `extensions/telegram/index.ts`
- `extensions/telegram/src/channel.ts`

### 3.2 Gateway 启动账号

ChannelManager 启动 plugin 账号：
- `src/gateway/server-channels.ts`

### 3.3 Telegram 连接模式

- Polling：`monitorTelegramProvider` → `TelegramPollingSession`
- Webhook：`startTelegramWebhook`

参考实现：
- `src/telegram/monitor.ts`
- `src/telegram/webhook.ts`

### 3.4 Telegram → Agent 回复

- grammY 处理消息 → `dispatchTelegramMessage`
- 进入通用 auto-reply 分发

参考实现：
- `src/telegram/bot.ts`
- `src/telegram/bot-message-dispatch.ts`
- `src/auto-reply/dispatch.ts`

---

## 4. WarClaw 的最小协议实现清单（建议）

1. **WS 连接 + connect 协议**
   - token/password
   - device identity（如使用 HTTPS/localhost）

2. **基础方法调用**
   - `chat.send`
   - `chat.history`
   - `sessions.list`
   - `tools.catalog`

3. **事件订阅**
   - chat 流式事件
   - agent/tool 事件

4. **重连与错误处理**
   - AUTH_* 错误
   - reconnect backoff

---

## 5. UI 设计建议（游戏化映射）

- **角色 = Agent**：每个 agent 作为 NPC/角色
- **房间 = Session**：不同会话是不同场景
- **对话气泡 = Chat**：直接映射 `chat.send` / `chat` events
- **道具 = Tools**：工具调用反馈映射成道具/特效
- **任务/关卡 = Cron/Jobs**：长期任务或提醒

---

## 6. 下一步可扩展方向

- 在方案 A 基础上实现 MVP（Phaser + Gateway WS）。
- 若验证成功，再考虑迁移到方案 B（Godot/Unity）。
- 若需要更强安全/可靠性，方案 D（Proxy）可引入。

---

如需进一步扩展，我可以补：
- Gateway 协议的详细 JSON schema
- 事件字段与 UI 状态映射
- MVP 实现里程碑和工程结构
