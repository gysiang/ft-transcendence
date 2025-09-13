import type { WebSocket as WSSocket } from 'ws';

// room -> sockets in that room
export const rooms = new Map<string, Set<WSSocket>>();
// socket -> rooms it has joined
const socketRooms = new WeakMap<WSSocket, Set<string>>();

export function joinRoom(ws: WSSocket, room: string) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);

  if (!socketRooms.has(ws)) socketRooms.set(ws, new Set());
  socketRooms.get(ws)!.add(room);
}

export function leaveRoom(ws: WSSocket, room: string) {
  rooms.get(room)?.delete(ws);
  if ((rooms.get(room)?.size ?? 0) === 0) rooms.delete(room);
  socketRooms.get(ws)?.delete(room);
}

export function leaveAll(ws: WSSocket) {
  const set = socketRooms.get(ws);
  if (!set) return;
  for (const r of set) rooms.get(r)?.delete(ws);
  socketRooms.delete(ws);
}

export function broadcast(room: string, payload: unknown, except?: WSSocket) {
  const json = JSON.stringify(payload);
  const set = rooms.get(room);
  if (!set) return;
  for (const s of set) {
    if (s === except) continue;
    if (s.readyState === s.OPEN) {
      try { s.send(json); } catch {}
    }
  }
}
