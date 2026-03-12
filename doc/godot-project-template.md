# WarClaw：Godot 工程结构模板（含 Gateway 客户端骨架）

本模板用于快速搭建 WarClaw（Godot）工程，覆盖：
- 网络层（Gateway WebSocket 客户端）
- UI 层（场景/状态机）
- 资源层（角色/NPC/关卡）
- 平台层（输入/分辨率/导出配置）

---

## 1. 推荐目录结构

```
res://
  WarClaw.tscn                 # 主场景
  autoload/
    App.gd                      # 全局入口（单例）
    Config.gd                   # 配置读取/保存
    GatewayClient.gd            # Gateway WS 客户端
    SessionStore.gd             # 会话/聊天状态缓存
    InputRouter.gd              # 输入映射
  scenes/
    splash/
      Splash.tscn
      Splash.gd
    world/
      World.tscn                # 主世界
      World.gd
    ui/
      Hud.tscn                  # 游戏 HUD
      Hud.gd
      DialogPanel.tscn          # 对话面板
      DialogPanel.gd
      ToolPanel.tscn            # 工具/道具面板
      ToolPanel.gd
      SessionsPanel.tscn        # 会话列表
      SessionsPanel.gd
  gameplay/
    npc/
      AgentNpc.tscn
      AgentNpc.gd
    room/
      SessionRoom.tscn
      SessionRoom.gd
  net/
    GatewayProtocol.gd          # 帧格式/方法封装
    GatewayTypes.gd             # 数据结构
    Reconnect.gd                # 重连策略
  assets/
    sprites/
    tiles/
    fonts/
  config/
    default.cfg                 # 默认配置
```

---

## 2. 自动加载单例（Project Settings → Autoload）

建议注册：
- `App.gd`
- `GatewayClient.gd`
- `SessionStore.gd`
- `InputRouter.gd`

---

## 3. Gateway 客户端骨架（GDScript 示例）

> 说明：这里只是结构模板。字段名/方法名需对齐 OpenClaw 的 Gateway 协议与当前版本。

```gdscript
# res://autoload/GatewayClient.gd
extends Node

signal connected
signal disconnected
signal event_received(event_name, payload)
signal response_received(req_id, ok, payload, err)

var ws := WebSocketPeer.new()
var request_id := 0
var pending := {}
var gateway_url := "ws://127.0.0.1:18789"  # 示例
var token := ""
var password := ""

func _process(_delta):
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.poll()
        while ws.get_available_packet_count() > 0:
            var pkt = ws.get_packet().get_string_from_utf8()
            _handle_packet(pkt)

func connect_gateway(url: String, token_in := "", password_in := ""):
    gateway_url = url
    token = token_in
    password = password_in
    var err = ws.connect_to_url(gateway_url)
    if err != OK:
        push_error("WS connect error: %s" % err)
        return

func send_connect():
    var payload = {
        "type": "req",
        "id": _next_id(),
        "method": "connect",
        "params": {
            "auth": {
                "token": token if token != "" else null,
                "password": password if password != "" else null
            },
            "client": {
                "id": "openclaw-control-ui", # 对齐 client name
                "mode": "webchat"
            }
        }
    }
    _send_json(payload)

func request(method: String, params := {}):
    var id = _next_id()
    pending[id] = {"method": method}
    _send_json({"type":"req","id":id,"method":method,"params":params})
    return id

func _handle_packet(text: String):
    var data = JSON.parse_string(text)
    if data == null:
        return
    if data.has("type") and data.type == "event":
        emit_signal("event_received", data.event, data.payload)
        return
    if data.has("type") and data.type == "res":
        emit_signal("response_received", data.id, data.ok, data.payload, data.error)
        pending.erase(data.id)

func _send_json(obj: Dictionary):
    var raw = JSON.stringify(obj)
    ws.send_text(raw)

func _next_id() -> String:
    request_id += 1
    return str(request_id)
```

---

## 4. 会话与聊天状态缓存（示例结构）

```gdscript
# res://autoload/SessionStore.gd
extends Node

var sessions := []
var active_session_key := ""
var chat_messages := []

func set_active_session(key: String):
    active_session_key = key

func append_message(role: String, text: String):
    chat_messages.append({"role": role, "text": text, "ts": Time.get_unix_time_from_system()})
```

---

## 5. UI 与游戏化映射

- **Agent NPC**：每个 agent 作为 NPC 角色
- **Room**：每个 session 作为房间/关卡
- **DialogPanel**：对话输入框 → `chat.send`
- **ToolPanel**：工具列表 → `tools.catalog`

---

## 6. 平台与导出配置（最小建议）

- 分辨率：使用逻辑分辨率 + 缩放适配
- 输入：键盘/手柄/触屏分别映射
- 网络：WebSocket + TLS 配置

---

## 7. MVP 最小交付清单

1. 可连接 Gateway
2. 可发送 `chat.send`
3. 可接收 `chat` 事件
4. 可切换 session
5. UI 有基础对话面板

---

## 8. 参考 OpenClaw 路径

- Gateway WS 逻辑：`src/gateway/server/ws-connection/message-handler.ts`
- 方法分发：`src/gateway/server-methods.ts`
- Chat 方法：`src/gateway/server-methods/chat.ts`
- Control UI 客户端：`ui/src/ui/gateway.ts`
