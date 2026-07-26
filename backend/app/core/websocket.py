import json
import asyncio
from typing import Dict, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set of active WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Set of all active WebSockets
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.all_connections.add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        self.all_connections.discard(websocket)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            data = json.dumps(message)
            to_remove = set()
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_text(data)
                except Exception:
                    to_remove.add(connection)
            for conn in to_remove:
                self.disconnect(conn, user_id)

    async def broadcast(self, message: dict):
        if not self.all_connections:
            return
        data = json.dumps(message)
        to_remove = set()
        for connection in list(self.all_connections):
            try:
                await connection.send_text(data)
            except Exception:
                to_remove.add(connection)
        for conn in to_remove:
            self.all_connections.discard(conn)


manager = ConnectionManager()


def notify_realtime(entity: str, action: str, data: Optional[dict] = None, user_id: Optional[int] = None):
    """
    Sincrónico/Asincrónico helper para ser invocado desde servicios de SQLAlchemy/FastAPI.
    """
    payload = {
        "type": "REALTIME_UPDATE",
        "entity": entity,
        "action": action,
        "data": data or {},
    }

    try:
        loop = asyncio.get_running_loop()
        if user_id:
            loop.create_task(manager.send_personal_message(payload, user_id))
        else:
            loop.create_task(manager.broadcast(payload))
    except RuntimeError:
        # Si no hay evento corriendo en el hilo actual, ejecutar con asyncio.run
        if user_id:
            asyncio.run(manager.send_personal_message(payload, user_id))
        else:
            asyncio.run(manager.broadcast(payload))
