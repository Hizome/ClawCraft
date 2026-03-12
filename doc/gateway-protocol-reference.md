# ClawCraft：OpenClaw Gateway 协议参考（精简版）

本文件面向 ClawCraft 客户端实现，提供 Gateway WebSocket 连接、方法调用与事件流的**最小可用参考**。

> 说明：本参考基于 OpenClaw Control UI 的实现路径整理，字段名以源码为准。若 Gateway 协议后续升级，请以 `src/gateway/protocol/*` 与 `ui/src/ui/gateway.ts` 为主。

---

## 1. 连接模型

### 1.1 传输层
- **协议**：WebSocket
- **双向 JSON 帧**

### 1.2 Connect 帧（概要）

客户端连接后发送 `connect` 请求，携带：
- token / password（二选一或同时）
- device identity（安全上下文下）
- client name / mode / version

参考实现：
- `ui/src/ui/gateway.ts`
- `src/gateway/server/ws-connection/message-handler.ts`

---

## 2. 方法调用（RPC）

所有方法调用统一为：

```json
{ "type": "req", "id": "<uuid>", "method": "chat.send", "params": { ... } }
```

响应：

```json
{ "type": "res", "id": "<uuid>", "ok": true, "payload": { ... } }
```

错误：

```json
{ "type": "res", "id": "<uuid>", "ok": false, "error": { "code": "...", "message": "..." } }
```

参考实现：
- `src/gateway/server-methods.ts`
- `src/gateway/protocol/index.ts`

---

## 3. 常用方法清单（ClawCraft MVP 级别）

### 3.1 `chat.send`
**用途**：向 agent 发送用户消息。

参考实现：
- `src/gateway/server-methods/chat.ts`
- `ui/src/ui/controllers/chat.ts`

### 3.2 `chat.history`
**用途**：拉取会话历史。

参考实现：
- `src/gateway/server-methods/chat.ts`
- `ui/src/ui/controllers/chat.ts`

### 3.3 `sessions.list`
**用途**：列出会话列表，驱动“房间/关卡”。

参考实现：
- `src/gateway/server-methods/sessions.ts`

### 3.4 `tools.catalog`
**用途**：获取工具列表，用于 UI 显示“道具/能力”。

参考实现：
- `src/gateway/server-methods/tools-catalog.ts`

### 3.5 `exec.approvals.*`
**用途**：外部执行审批（若 ClawCraft 要提供此能力）。

参考实现：
- `src/gateway/server-methods/exec-approvals.ts`
- `ui/src/ui/controllers/exec-approval.ts`

---

## 4. 事件流

事件帧统一为：

```json
{ "type": "event", "event": "chat", "payload": { ... } }
```

**常见事件**：
- `chat`：聊天流式输出
- `agent`：agent 状态/工具调用
- `update`：版本更新提醒

参考实现：
- `ui/src/ui/app-gateway.ts`
- `src/gateway/events.ts`

---

## 5. 错误处理与重连

- `AUTH_*` 错误需提示用户重新认证或配对。
- 控制面断开需指数退避重连（Control UI 有实现）。

参考实现：
- `ui/src/ui/gateway.ts`

---

## 6. 推荐实现策略（ClawCraft 端）

1. 基于 Control UI 的 `GatewayBrowserClient` 逻辑实现 WS 客户端。
2. 最小接入：`chat.send` + `chat.history` + `chat` 事件。
3. 再逐步扩展：`sessions.list`、`tools.catalog`、`exec.approvals`。
