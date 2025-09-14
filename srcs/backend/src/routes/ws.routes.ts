import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { createTournament,getByCode, tournaments } from "../remoteTournament/realtimeTournament";
import { leaveAll } from "../remoteTournament/rooms";
export async function wsRoutes(app: FastifyInstance){

app.get('/ws', { websocket: true, preHandler: [app.authenticate] }, (conn, req) => {
  const raw: any = conn;
  const socket: WebSocket = raw?.socket ? raw.socket as WebSocket : raw as WebSocket;

  const rawId = req.userData?.id;
  const n = typeof rawId === 'number' ? rawId : Number(rawId);
  const uid: number | null = n;
  
  const aliasFromSession = req.userData?.name || 'Player';
  (socket as any).alias = String(aliasFromSession);

  let myTournamentId: string | null = null;
  let myPlayerId: string | null = null;

  socket.on('message', (buf) => {
    let msg: any; 
    try { 
      msg = JSON.parse(typeof buf === 'string' ? buf : buf.toString()); 
    } catch 
    { return; }

    switch (msg?.type) {
      case 't.create': {
        const name        = String(msg.name ?? 'Tournament');
        const goalLimit   = Math.max(1, Number(msg.goalLimit ?? 5));
        const maxPlayers  = Math.min(8, Math.max(2, Number(msg.maxPlayers ?? 8)));
        const alias       = (socket as any).alias;

        const t = createTournament({ name, goalLimit, maxPlayers });
        const pid = t.addPlayer(socket, alias, uid);
        t.setHost(pid);

        myTournamentId = t.id;
        myPlayerId = pid;

        socket.send(JSON.stringify({ type: 't.created', id: t.id, code: t.code, pid }));
        break;
      }

      case 't.join': {
        const code  = String(msg.code ?? '');
        const alias = (socket as any).alias;

        const t = getByCode(code);
        if (!t) {
          socket.send(JSON.stringify({ type: 't.error', msg: 'Invalid code' }));
          break;
        }
        if (t.started) {
          socket.send(JSON.stringify({ type:'t.error', msg:'Tournament already started' }));
          break;
        }
        if (t.players.size >= t.maxPlayers) {
          socket.send(JSON.stringify({ type:'t.error', msg:'Tournament is full' }));
          break;
        }
        for (const p of t.players.values()) {
          if (p.userId != null && p.userId === uid) {
            socket.send(JSON.stringify({ type:'t.error', msg:'You are already in this tournament' }));
            break;
          }}
        const pid = t.addPlayer(socket, alias, uid);
        myTournamentId = t.id;
        myPlayerId = pid;

        socket.send(JSON.stringify({ type: 't.joined', id: t.id, pid }));
        break;
      }

      case 't.ready': {
        if (!myTournamentId || !myPlayerId) break;
        const t = tournaments.get(myTournamentId);
        if (!t) break;
        t.markReady(myPlayerId, !!msg.ready);
        break;
      }

      case 't.start': {
        if (!myTournamentId || !myPlayerId) break;
        const t = tournaments.get(myTournamentId);
        if (!t) break;
        if (t.host !== myPlayerId) {
          socket.send(JSON.stringify({ type: 't.error', msg: 'Only host can start' }));
          break;
        }
        void t.start();
        break;
      }
      case 't.leave': {
        if (!myTournamentId || !myPlayerId) break;
        const t = tournaments.get(myTournamentId);
        if (!t)
          break;
        const p = t.players.get(myPlayerId);
        if (p)
          leaveAll(p.ws);
        t.players.delete(myPlayerId);
        if (t.host === myPlayerId) {
          const first = [...t.players.keys()][0];
          if (first) t.setHost(first);
        }
        t['pushState']?.();
        myTournamentId = null;
        myPlayerId = null;
        break;
      }
    }
  });
})}