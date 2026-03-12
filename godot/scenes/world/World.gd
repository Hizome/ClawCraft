extends Node2D

@onready var gateway := GatewayClient

func _ready() -> void:
    gateway.connect_gateway("ws://127.0.0.1:18789")
    gateway.send_connect()
    gateway.event_received.connect(_on_gateway_event)

func _on_gateway_event(event_name: String, payload) -> void:
    # TODO: route chat/agent events into UI
    pass
