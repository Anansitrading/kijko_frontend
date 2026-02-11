"""WebSocket connection manager for real-time event streaming.

Supports rooms (org, project, user) and JWT authentication.
Events: ingestion_progress, execution_update, notification.
"""

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections and rooms.

    Rooms are hierarchical:
    - org:{org_id} — organization-wide events
    - project:{project_id} — project-specific events (ingestion)
    - user:{user_id} — user-specific notifications

    Usage:
        manager = ConnectionManager()
        await manager.connect(websocket, user_claims)
        await manager.broadcast_to_room("org:abc", {"type": "notification", ...})
    """

    def __init__(self):
        # Active connections: websocket → user_claims
        self._connections: dict[WebSocket, dict] = {}
        # Room memberships: room_name → set of websockets
        self._rooms: dict[str, set[WebSocket]] = {}

    @property
    def active_connections(self) -> int:
        return len(self._connections)

    async def connect(self, websocket: WebSocket, user_claims: dict) -> None:
        """Accept a WebSocket connection and auto-join default rooms."""
        await websocket.accept()
        self._connections[websocket] = user_claims

        # Auto-join user and org rooms
        user_id = user_claims.get("sub", "")
        org_id = user_claims.get("org_id", "")

        if user_id:
            self.join_room(websocket, f"user:{user_id}")
        if org_id:
            self.join_room(websocket, f"org:{org_id}")

        logger.info(
            "WebSocket connected: user=%s, org=%s, total=%d",
            user_id, org_id, self.active_connections,
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket from all rooms and tracking."""
        # Remove from all rooms
        rooms_to_clean = []
        for room_name, members in self._rooms.items():
            members.discard(websocket)
            if not members:
                rooms_to_clean.append(room_name)

        # Clean empty rooms
        for room in rooms_to_clean:
            del self._rooms[room]

        # Remove from connections
        user_claims = self._connections.pop(websocket, {})
        logger.info(
            "WebSocket disconnected: user=%s, total=%d",
            user_claims.get("sub", "unknown"),
            self.active_connections,
        )

    def join_room(self, websocket: WebSocket, room: str) -> None:
        """Add a WebSocket to a room."""
        if room not in self._rooms:
            self._rooms[room] = set()
        self._rooms[room].add(websocket)

    def leave_room(self, websocket: WebSocket, room: str) -> None:
        """Remove a WebSocket from a room."""
        if room in self._rooms:
            self._rooms[room].discard(websocket)
            if not self._rooms[room]:
                del self._rooms[room]

    async def send_personal(self, websocket: WebSocket, data: dict[str, Any]) -> None:
        """Send data to a specific WebSocket connection."""
        try:
            await websocket.send_json(data)
        except Exception:
            self.disconnect(websocket)

    async def broadcast_to_room(self, room: str, data: dict[str, Any]) -> None:
        """Send data to all connections in a room."""
        if room not in self._rooms:
            return

        disconnected = []
        for ws in self._rooms[room]:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_all(self, data: dict[str, Any]) -> None:
        """Send data to all connected clients."""
        disconnected = []
        for ws in self._connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    def get_room_members(self, room: str) -> int:
        """Get the number of connections in a room."""
        return len(self._rooms.get(room, set()))


# Singleton instance
manager = ConnectionManager()


# =============================================================================
# Event Publishing Utilities (for use by other services)
# =============================================================================

async def publish_ingestion_progress(
    project_id: str,
    phase: str,
    progress: float,
    message: str | None = None,
) -> None:
    """Publish ingestion progress to project room."""
    await manager.broadcast_to_room(f"project:{project_id}", {
        "type": "ingestion_progress",
        "project_id": project_id,
        "phase": phase,
        "progress": progress,
        "message": message,
    })


async def publish_execution_update(
    user_id: str,
    execution_id: str,
    status: str,
    skill_name: str | None = None,
) -> None:
    """Publish execution status update to user room."""
    await manager.broadcast_to_room(f"user:{user_id}", {
        "type": "execution_update",
        "execution_id": execution_id,
        "status": status,
        "skill_name": skill_name,
    })


async def publish_notification(
    org_id: str,
    title: str,
    message: str,
    level: str = "info",
) -> None:
    """Publish a notification to all org members."""
    await manager.broadcast_to_room(f"org:{org_id}", {
        "type": "notification",
        "title": title,
        "message": message,
        "level": level,
    })
