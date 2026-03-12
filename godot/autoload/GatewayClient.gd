extends Node

signal connected
signal disconnected
signal event_received(event_name, payload)
signal response_received(req_id, ok, payload, err)

var ws := WebSocketPeer.new()
var request_id := 0
var pending := {}

var gateway_url := "ws://127.0.0.1:18789"
var token := ""
var password := ""

func _process(_delta: float) -> void:
    if ws.get_ready_state() == WebSocketPeer.STATE_OPEN:
        ws.poll()
        while ws.get_available_packet_count() > 0:
            var pkt := ws.get_packet().get_string_from_utf8()
            _handle_packet(pkt)

func connect_gateway(url: String, token_in := "", password_in := "") -> void:
    gateway_url = url
    token = token_in
    password = password_in
    var err := ws.connect_to_url(gateway_url)
    if err != OK:
        push_error("WS connect error: %s" % err)
        return

func send_connect() -> void:
    var payload := {
        "type": "req",
        "id": _next_id(),
        "method": "connect",
        "params": {
            "auth": {
                "token": token if token != "" else null,
                "password": password if password != "" else null
            },
            "client": {
                "id": "openclaw-control-ui",
                "mode": "webchat"
            }
        }
    }
    _send_json(payload)

func request(method: String, params := {}) -> String:
    var id := _next_id()
    pending[id] = {"method": method}
    _send_json({"type": "req", "id": id, "method": method, "params": params})
    return id

func _handle_packet(text: String) -> void:
    var data = JSON.parse_string(text)
    if data == null:
        return
    if data.has("type") and data.type == "event":
        emit_signal("event_received", data.event, data.payload)
        return
    if data.has("type") and data.type == "res":
        emit_signal("response_received", data.id, data.ok, data.payload, data.error)
        pending.erase(data.id)

func _send_json(obj: Dictionary) -> void:
    var raw := JSON.stringify(obj)
    ws.send_text(raw)

func _next_id() -> String:
    request_id += 1
    return str(request_id)
