# WarClaw MVP 计划（阶段拆分）

目标：用 2D 游戏式 UI 驱动 OpenClaw Gateway，完成基础对话与会话管理。

---

## 阶段 0：需求与假设验证

- 明确平台优先级：Web / Desktop / Mobile
- 决定方案：默认推荐方案 A（Web + Phaser）
- 确定最小功能范围：
  - 会话列表
  - 聊天发送与流式回复
  - Agent 切换

---

## 阶段 1：协议最小接入（P0）

**目标**：可连接 Gateway，完成基础聊天

- 建立 WebSocket 连接
- 实现 `connect` + token/password 授权
- 实现 `chat.send` 与 `chat.history`
- 处理 `chat` 事件流（增量/最终）

产出：
- 可用 Demo（命令行或简易 UI）

---

## 阶段 2：2D 游戏 UI 原型（P1）

**目标**：将聊天与会话映射成游戏 UI

- 角色/房间/对话气泡 UI
- 键盘/手柄输入（可选）
- Agent 作为 NPC，Session 作为关卡/房间

产出：
- 2D 游戏式 UI Demo

---

## 阶段 3：功能扩展（P2）

- `sessions.list` / `sessions.delete`
- `tools.catalog` → 道具/技能菜单
- `exec.approvals` → 系统提示 + 审批 UI

产出：
- 可替代 Control UI 的核心功能

---

## 阶段 4：跨端打包与发布（P3）

- Web：PWA
- Desktop：Tauri/Electron
- Mobile：Capacitor/React Native WebView

---

## 风险清单

- Gateway 协议升级导致兼容问题
- 设备身份与 HTTPS 安全要求
- 游戏式 UI 与文本密集交互的折中

---

## 下一步建议

1. 选择方案 A 或 B 作为 MVP 基线。
2. 先实现协议层 Demo，再进入 UI 层。
3. MVP 完成后再考虑 Proxy 或原生引擎。
