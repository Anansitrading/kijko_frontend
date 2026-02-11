# Plan 04-01: WebSocket Real-time Events — COMPLETE ✅

## What was built
- `server/app/services/websocket.py` — ConnectionManager
  - Room-based event streaming: org:{id}, project:{id}, user:{id}
  - Auto-join user and org rooms on connect
  - Broadcast to rooms with optional sender exclusion
  - Event publishing utilities:
    - publish_ingestion_progress (project room)
    - publish_execution_update (org + user rooms)
    - publish_notification (user room)
  - Singleton pattern: `manager = ConnectionManager()`

- `server/app/routers/ws.py` — WebSocket endpoint
  - WS /ws?token=<jwt> — JWT auth via query parameter
  - Client actions: join (room), leave (room), ping → pong
  - Room access validation: enforces org/user room ownership
  - Graceful disconnect handling with room cleanup

## Key decisions
- Query parameter JWT auth (WebSocket headers not reliable across browsers)
- Room-based pub/sub instead of per-connection channels
- Auto-join user + org rooms — clients only need manual project room joins
- Connection cleanup on any disconnect (clean or error)

## Tests
- 5 WebSocket tests (manager, rooms, event publishing)

## Commit
- `cf79cc4` — feat: Phase 4 — WebSocket real-time, GDPR compliance, observability
