"""Tests for WebSocket ConnectionManager and event publishing utilities.

Covers:
- Connection lifecycle (connect, disconnect, room management)
- Personal and broadcast messaging with error handling
- Event publishing helpers (ingestion, execution, notification)
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from server.app.services.websocket import (
    ConnectionManager,
    publish_ingestion_progress,
    publish_execution_update,
    publish_notification,
    manager,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_mock_websocket() -> MagicMock:
    """Create a mock WebSocket with accept and send_json as AsyncMocks."""
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


# ---------------------------------------------------------------------------
# TestConnectionManager
# ---------------------------------------------------------------------------

class TestConnectionManager:
    """Tests for ConnectionManager connection and room management."""

    def test_initial_state(self):
        """New manager has zero connections and no rooms."""
        mgr = ConnectionManager()
        assert mgr.active_connections == 0
        assert mgr._rooms == {}

    @pytest.mark.asyncio
    async def test_connect_auto_joins_rooms(self):
        """connect() accepts the websocket and auto-joins user and org rooms."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        claims = {"sub": "user-1", "org_id": "org-42"}

        await mgr.connect(ws, claims)

        ws.accept.assert_awaited_once()
        assert mgr.active_connections == 1
        assert ws in mgr._rooms["user:user-1"]
        assert ws in mgr._rooms["org:org-42"]

    @pytest.mark.asyncio
    async def test_connect_without_org_id(self):
        """connect() with no org_id only joins the user room."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        claims = {"sub": "user-1"}

        await mgr.connect(ws, claims)

        assert ws in mgr._rooms["user:user-1"]
        assert "org:" not in " ".join(mgr._rooms.keys())

    @pytest.mark.asyncio
    async def test_connect_without_sub(self):
        """connect() with no sub only joins the org room."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        claims = {"org_id": "org-42"}

        await mgr.connect(ws, claims)

        assert ws in mgr._rooms["org:org-42"]
        assert "user:" not in " ".join(mgr._rooms.keys())

    @pytest.mark.asyncio
    async def test_active_connections_count(self):
        """active_connections reflects the number of connected websockets."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()

        await mgr.connect(ws1, {"sub": "u1", "org_id": "o1"})
        assert mgr.active_connections == 1

        await mgr.connect(ws2, {"sub": "u2", "org_id": "o1"})
        assert mgr.active_connections == 2

    @pytest.mark.asyncio
    async def test_disconnect_removes_from_all_rooms(self):
        """disconnect() removes the websocket from every room it belongs to."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        await mgr.connect(ws, {"sub": "u1", "org_id": "o1"})
        mgr.join_room(ws, "project:p1")

        mgr.disconnect(ws)

        assert mgr.active_connections == 0
        # All rooms that contained only this ws should be cleaned
        for members in mgr._rooms.values():
            assert ws not in members

    @pytest.mark.asyncio
    async def test_disconnect_cleans_empty_rooms(self):
        """disconnect() deletes rooms that become empty."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        await mgr.connect(ws, {"sub": "u1", "org_id": "o1"})

        mgr.disconnect(ws)

        assert "user:u1" not in mgr._rooms
        assert "org:o1" not in mgr._rooms

    def test_disconnect_unknown_websocket_no_error(self):
        """disconnect() on an unknown websocket does not raise."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        # Should not raise
        mgr.disconnect(ws)
        assert mgr.active_connections == 0

    def test_join_room_creates_room(self):
        """join_room() creates the room if it doesn't exist."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        mgr.join_room(ws, "project:p1")

        assert "project:p1" in mgr._rooms
        assert ws in mgr._rooms["project:p1"]

    def test_join_room_adds_to_existing_room(self):
        """join_room() adds to an existing room without removing others."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()

        mgr.join_room(ws1, "project:p1")
        mgr.join_room(ws2, "project:p1")

        assert ws1 in mgr._rooms["project:p1"]
        assert ws2 in mgr._rooms["project:p1"]
        assert len(mgr._rooms["project:p1"]) == 2

    def test_leave_room_removes_from_room(self):
        """leave_room() removes the websocket from the room."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()
        mgr.join_room(ws1, "project:p1")
        mgr.join_room(ws2, "project:p1")

        mgr.leave_room(ws1, "project:p1")

        assert ws1 not in mgr._rooms["project:p1"]
        assert ws2 in mgr._rooms["project:p1"]

    def test_leave_room_cleans_empty_room(self):
        """leave_room() deletes the room when the last member leaves."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        mgr.join_room(ws, "project:p1")

        mgr.leave_room(ws, "project:p1")

        assert "project:p1" not in mgr._rooms

    def test_leave_room_unknown_room_no_error(self):
        """leave_room() on an unknown room does not raise."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        # Should not raise
        mgr.leave_room(ws, "nonexistent:room")

    def test_get_room_members_count(self):
        """get_room_members() returns the correct member count."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()
        mgr.join_room(ws1, "project:p1")
        mgr.join_room(ws2, "project:p1")

        assert mgr.get_room_members("project:p1") == 2

    def test_get_room_members_unknown_room_returns_zero(self):
        """get_room_members() returns 0 for a non-existent room."""
        mgr = ConnectionManager()
        assert mgr.get_room_members("nonexistent:room") == 0


# ---------------------------------------------------------------------------
# TestMessaging
# ---------------------------------------------------------------------------

class TestMessaging:
    """Tests for personal and broadcast messaging."""

    @pytest.mark.asyncio
    async def test_send_personal_success(self):
        """send_personal() sends JSON data to the websocket."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        data = {"type": "test", "payload": "hello"}

        await mgr.send_personal(ws, data)

        ws.send_json.assert_awaited_once_with(data)

    @pytest.mark.asyncio
    async def test_send_personal_error_disconnects_client(self):
        """send_personal() disconnects the client on send failure."""
        mgr = ConnectionManager()
        ws = make_mock_websocket()
        await mgr.connect(ws, {"sub": "u1", "org_id": "o1"})
        ws.send_json.side_effect = RuntimeError("connection closed")

        await mgr.send_personal(ws, {"type": "test"})

        assert mgr.active_connections == 0

    @pytest.mark.asyncio
    async def test_broadcast_to_room_sends_to_all_members(self):
        """broadcast_to_room() sends to every websocket in the room."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()
        await mgr.connect(ws1, {"sub": "u1"})
        await mgr.connect(ws2, {"sub": "u2"})
        mgr.join_room(ws1, "project:p1")
        mgr.join_room(ws2, "project:p1")
        data = {"type": "update"}

        await mgr.broadcast_to_room("project:p1", data)

        ws1.send_json.assert_awaited_with(data)
        ws2.send_json.assert_awaited_with(data)

    @pytest.mark.asyncio
    async def test_broadcast_to_room_empty_room_no_error(self):
        """broadcast_to_room() to an unknown room does not raise."""
        mgr = ConnectionManager()
        # Should not raise
        await mgr.broadcast_to_room("nonexistent:room", {"type": "test"})

    @pytest.mark.asyncio
    async def test_broadcast_to_room_disconnects_failed_clients(self):
        """broadcast_to_room() disconnects clients that fail to receive."""
        mgr = ConnectionManager()
        ws_ok = make_mock_websocket()
        ws_fail = make_mock_websocket()
        ws_fail.send_json.side_effect = RuntimeError("broken pipe")

        await mgr.connect(ws_ok, {"sub": "u1"})
        await mgr.connect(ws_fail, {"sub": "u2"})
        mgr.join_room(ws_ok, "project:p1")
        mgr.join_room(ws_fail, "project:p1")

        await mgr.broadcast_to_room("project:p1", {"type": "test"})

        # The good client stays, the broken one is disconnected
        assert mgr.active_connections == 1
        assert ws_ok in mgr._connections
        assert ws_fail not in mgr._connections

    @pytest.mark.asyncio
    async def test_broadcast_all_sends_to_everyone(self):
        """broadcast_all() sends to all connected websockets."""
        mgr = ConnectionManager()
        ws1 = make_mock_websocket()
        ws2 = make_mock_websocket()
        await mgr.connect(ws1, {"sub": "u1"})
        await mgr.connect(ws2, {"sub": "u2"})
        data = {"type": "global"}

        await mgr.broadcast_all(data)

        ws1.send_json.assert_awaited_with(data)
        ws2.send_json.assert_awaited_with(data)

    @pytest.mark.asyncio
    async def test_broadcast_all_disconnects_failed_clients(self):
        """broadcast_all() disconnects clients that fail to receive."""
        mgr = ConnectionManager()
        ws_ok = make_mock_websocket()
        ws_fail = make_mock_websocket()
        ws_fail.send_json.side_effect = RuntimeError("connection reset")

        await mgr.connect(ws_ok, {"sub": "u1"})
        await mgr.connect(ws_fail, {"sub": "u2"})

        await mgr.broadcast_all({"type": "global"})

        assert mgr.active_connections == 1
        assert ws_ok in mgr._connections
        assert ws_fail not in mgr._connections


# ---------------------------------------------------------------------------
# TestEventPublishing
# ---------------------------------------------------------------------------

class TestEventPublishing:
    """Tests for the module-level event publishing utilities."""

    @pytest.mark.asyncio
    async def test_publish_ingestion_progress_format(self):
        """publish_ingestion_progress() broadcasts the correct payload."""
        with patch.object(manager, "broadcast_to_room", new_callable=AsyncMock) as mock_broadcast:
            await publish_ingestion_progress(
                project_id="proj-1",
                phase="embedding",
                progress=0.75,
                message="Processing chunks",
            )

            mock_broadcast.assert_awaited_once_with(
                "project:proj-1",
                {
                    "type": "ingestion_progress",
                    "project_id": "proj-1",
                    "phase": "embedding",
                    "progress": 0.75,
                    "message": "Processing chunks",
                },
            )

    @pytest.mark.asyncio
    async def test_publish_execution_update_format(self):
        """publish_execution_update() broadcasts the correct payload."""
        with patch.object(manager, "broadcast_to_room", new_callable=AsyncMock) as mock_broadcast:
            await publish_execution_update(
                user_id="user-1",
                execution_id="exec-42",
                status="running",
                skill_name="code_review",
            )

            mock_broadcast.assert_awaited_once_with(
                "user:user-1",
                {
                    "type": "execution_update",
                    "execution_id": "exec-42",
                    "status": "running",
                    "skill_name": "code_review",
                },
            )

    @pytest.mark.asyncio
    async def test_publish_notification_format(self):
        """publish_notification() broadcasts the correct payload."""
        with patch.object(manager, "broadcast_to_room", new_callable=AsyncMock) as mock_broadcast:
            await publish_notification(
                org_id="org-42",
                title="Deploy Complete",
                message="v2.1 is live",
                level="success",
            )

            mock_broadcast.assert_awaited_once_with(
                "org:org-42",
                {
                    "type": "notification",
                    "title": "Deploy Complete",
                    "message": "v2.1 is live",
                    "level": "success",
                },
            )

    @pytest.mark.asyncio
    async def test_publish_notification_default_level(self):
        """publish_notification() defaults level to 'info'."""
        with patch.object(manager, "broadcast_to_room", new_callable=AsyncMock) as mock_broadcast:
            await publish_notification(
                org_id="org-42",
                title="Info",
                message="Something happened",
            )

            call_args = mock_broadcast.call_args
            payload = call_args[0][1]
            assert payload["level"] == "info"
