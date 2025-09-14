import type { WebSocket} from 'ws';

export const rooms = new Map<string, Set<WebSocket>>();

const socketRooms = new WeakMap<WebSocket, Set<string>>();
//room maps sockets in that room
//socketRoom rooms the socket joined weakmap so the entry in socketrooms wont keep it alive in case of dc/etc
export function joinRoom(ws: WebSocket, room: string) {
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);

  if (!socketRooms.has(ws)) socketRooms.set(ws, new Set());
  socketRooms.get(ws)!.add(room);
}

export function leaveRoom(ws: WebSocket, room: string) {
  rooms.get(room)?.delete(ws);
  if ((rooms.get(room)?.size ?? 0) === 0)
    rooms.delete(room);
  socketRooms.get(ws)?.delete(room);
}

export function leaveAll(ws: WebSocket) {
  const set = socketRooms.get(ws);
  if (!set)
    return;
  for (const r of set)
    leaveRoom(ws, r);;
  socketRooms.delete(ws);
}

export function broadcast(room: string, payload: unknown, except?: WebSocket) {
  const json = JSON.stringify(payload);
  const set = rooms.get(room);
  if (!set)
    return;
  for (const s of set) {
    if (s === except)
      continue;
    if (s.readyState === s.OPEN) {
      try { s.send(json); } catch {}
    }
  }
}
