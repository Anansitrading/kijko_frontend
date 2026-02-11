"""WebSocket router — Real-time event streaming with JWT auth."""

import json
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from server.app.services.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    """WebSocket endpoint with JWT authentication.

    Connect: ws://host/ws?token=<jwt>

    Client messages:
    - {"action": "join", "room": "project:uuid"} — join a room
    - {"action": "leave", "room": "project:uuid"} — leave a room
    - {"action": "ping"} — heartbeat

    Server events:
    - {"type": "ingestion_progress", ...}
    - {"type": "execution_update", ...}
    - {"type": "notification", ...}
    - {"type": "pong"} — heartbeat response
    - {"type": "error", "message": "..."} — error messages
    """
    # Validate JWT
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        from server.app.services.keycloak import get_keycloak
        keycloak = get_keycloak()
        user_claims = await keycloak.validate_token(token)
    except Exception as e:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Accept and register connection
    await manager.connect(websocket, user_claims)

    try:
        while True:
            # Receive and process client messages
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                action = message.get("action", "")

                if action == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})

                elif action == "join":
                    room = message.get("room", "")
                    if room and _validate_room_access(room, user_claims):
                        manager.join_room(websocket, room)
                        await manager.send_personal(websocket, {
                            "type": "room_joined",
                            "room": room,
                        })
                    else:
                        await manager.send_personal(websocket, {
                            "type": "error",
                            "message": f"Cannot join room: {room}",
                        })

                elif action == "leave":
                    room = message.get("room", "")
                    if room:
                        manager.leave_room(websocket, room)
                        await manager.send_personal(websocket, {
                            "type": "room_left",
                            "room": room,
                        })

                else:
                    await manager.send_personal(websocket, {
                        "type": "error",
                        "message": f"Unknown action: {action}",
                    })

            except json.JSONDecodeError:
                await manager.send_personal(websocket, {
                    "type": "error",
                    "message": "Invalid JSON",
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.exception("WebSocket error: %s", e)
        manager.disconnect(websocket)


def _validate_room_access(room: str, user_claims: dict) -> bool:
    """Validate that a user can join a specific room.

    Rules:
    - org:{org_id} — must match user's org_id
    - project:{project_id} — allowed (RLS handles data access)
    - user:{user_id} — must match user's sub
    """
    parts = room.split(":", 1)
    if len(parts) != 2:
        return False

    room_type, room_id = parts

    if room_type == "org":
        return room_id == user_claims.get("org_id", "")
    elif room_type == "user":
        return room_id == user_claims.get("sub", "")
    elif room_type == "project":
        # Project access controlled by RLS at data level
        return True

    return False
