import { FastifyInstance } from "fastify";
import { RawData,WebSocket } from "ws";
import { enqueue } from "../onlineTourn";
import { createTournament,getByCode, tournaments } from "../realtimeTournament";
export async function wsRoutes(app: FastifyInstance)
{
    app.get('/ws', { websocket: true }, (conn, req) => {
    const raw = conn as any;
    const socket: WebSocket = (raw && raw.socket) ? (raw.socket as WebSocket) : (raw as WebSocket); //fastify/websocker && direct ws instance
    
    let myTournamentId: string | null = null;
    let myPlayerId: string | null = null;
    setTimeout(() => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
      }
    }, 0);
  
    socket.on('message', (data: RawData) => {
      const text = typeof data === 'string' ? data : data.toString();
      let msg: any; try { msg = JSON.parse(text); } catch { return; }
  
      switch (msg?.type) {
        case 'ping':
          socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
          break;
  
        case 'queue':
          enqueue(socket, typeof msg.goalLimit === 'number' ? msg.goalLimit : 5);
          socket.send(JSON.stringify({ type: 'queued' }));
          break;
          case 't.create': {
            const name = String(msg.name ?? 'Tournament');
            const goalLimit = Number(msg.goalLimit ?? 5);
            const maxPlayers = Math.min(8, Math.max(2, Number(msg.maxPlayers ?? 8)));
            const alias = String(msg.alias ?? 'Host');
    
            const t = createTournament({ name, goalLimit, maxPlayers });
            const pid = t.addPlayer(socket, alias);
            t.setHost(pid);
    
            myTournamentId = t.id;
            myPlayerId = pid;
    
            socket.send(JSON.stringify({ type: 't.created', id: t.id, code: t.code }));
            break;
          }
          case 't.join': {
            const code = String(msg.code ?? '');
            const alias = String(msg.alias ?? 'Player');
            const t = getByCode(code);
            if (!t) {
              socket.send(JSON.stringify({ type: 't.error', msg: 'Invalid code' }));
              break;
            }
            const pid = t.addPlayer(socket, alias);
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
            t.start();
            break;
          }
    
          default:
            break;
        }
      });
  
    const hb = setInterval(() => {
      if (socket.readyState === socket.OPEN)
        socket.ping();}, 30_000);
    socket.on('close', () => clearInterval(hb));
  });
}