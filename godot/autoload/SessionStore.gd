extends Node

var sessions := []
var active_session_key := ""
var chat_messages := []

func set_active_session(key: String) -> void:
    active_session_key = key

func append_message(role: String, text: String) -> void:
    chat_messages.append({
        "role": role,
        "text": text,
        "ts": Time.get_unix_time_from_system()
    })
